import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import StreetScene, { SceneData } from '../components/StreetScene';
import styles from '../styles/Home.module.css';

type RepositoryPayload = {
  repository: {
    name: string;
    full_name: string;
    default_branch: string;
    latest_commit_sha: string;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    description: string;
    topics: string[];
    homepage?: string | null;
    html_url: string;
    languages: Array<{ name: string; bytes: number }>;
  };
  commits: Array<{
    sha: string;
    message: string;
    author_name?: string | null;
    author_login?: string | null;
    committed_at?: string | null;
    additions?: number | null;
    deletions?: number | null;
    total_changes?: number | null;
    files_changed?: number | null;
    url?: string | null;
  }>;
  surreal: string[];
  scene: SceneData;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  'http://localhost:8000';

export default function HomePage() {
  const [current, setCurrent] = useState<RepositoryPayload | null>(null);
  const [nextRepo, setNextRepo] = useState<RepositoryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatLanguageBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = -1;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTimestamp = (timestamp?: string | null) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (err) {
      return timestamp;
    }
  };

  const commitAuthor = (commit: RepositoryPayload['commits'][number]) => {
    return commit.author_name || commit.author_login || 'Unknown author';
  };

  const commitStats = (commit: RepositoryPayload['commits'][number]) => {
    if (
      commit.total_changes == null &&
      commit.additions == null &&
      commit.deletions == null &&
      commit.files_changed == null
    ) {
      return null;
    }

    const pieces: string[] = [];
    if (commit.total_changes != null) {
      pieces.push(`${commit.total_changes} Δ`);
    } else {
      const add = commit.additions != null ? `+${commit.additions}` : null;
      const del = commit.deletions != null ? `-${commit.deletions}` : null;
      if (add || del) {
        pieces.push([add, del].filter(Boolean).join(' / '));
      }
    }
    if (commit.files_changed != null) {
      pieces.push(`${commit.files_changed} files`);
    }
    return pieces.join(' • ');
  };

  const fetchState = async () => {
    try {
      const [currentRes, nextRes] = await Promise.all([
        fetch(`${BACKEND_URL}/current`),
        fetch(`${BACKEND_URL}/next`),
      ]);
      if (!currentRes.ok || !nextRes.ok) {
        throw new Error('Backend is not ready yet.');
      }
      setCurrent(await currentRes.json());
      setNextRepo(await nextRes.json());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, []);

  const storySegments = useMemo(() => current?.surreal ?? [], [current]);
  const nextStorySegments = useMemo(() => nextRepo?.surreal ?? [], [nextRepo]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Repository Street</title>
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>Repository Street View</h1>
        {error && <p className={styles.error}>{error}</p>}
        {current && (
          <section className={styles.section}>
            <h2>Current Repository</h2>
            <p><strong>Name:</strong> {current.repository.full_name}</p>
            <p><strong>Branch:</strong> {current.repository.default_branch}</p>
            <p><strong>Latest SHA:</strong> {current.repository.latest_commit_sha}</p>
            <p>
              <strong>Stars:</strong> {current.repository.stargazers_count} • <strong>Forks:</strong>{' '}
              {current.repository.forks_count} • <strong>Open issues:</strong> {current.repository.open_issues_count}
            </p>
            {current.repository.description && (
              <p className={styles.description}>{current.repository.description}</p>
            )}
            {current.repository.topics.length > 0 && (
              <div className={styles.badgeRow}>
                {current.repository.topics.map((topic) => (
                  <span key={topic} className={styles.badge}>{topic}</span>
                ))}
              </div>
            )}
            {current.repository.languages.length > 0 && (
              <div className={styles.commitList}>
                <h3>{current.repository.name} Languages</h3>
                <ul>
                  {current.repository.languages.map((language) => (
                    <li key={language.name}>
                      {language.name} — {formatLanguageBytes(language.bytes)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <StreetScene scene={current.scene} />
            <div className={styles.commitList}>
              <h3>{current.repository.name} Storyline</h3>
              <ul>
                {storySegments.map((statement, index) => (
                  <li key={index}>{statement}</li>
                ))}
              </ul>
            </div>
            <div className={styles.commitList}>
              <h3>{current.repository.name} Activity</h3>
              <ul>
                {current.commits.map((commit) => {
                  const timestamp = formatTimestamp(commit.committed_at);
                  const stats = commitStats(commit);
                  return (
                    <li key={commit.sha}>
                      <div>
                        <code>{commit.sha.slice(0, 7)}</code> — {commit.message}
                      </div>
                      <div className={styles.commitMeta}>
                        {commitAuthor(commit)}
                        {timestamp && <span> • {timestamp}</span>}
                        {stats && <span> • {stats}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {nextRepo && (
          <section className={styles.section}>
            <h2>Next Stop</h2>
            <p><strong>Name:</strong> {nextRepo.repository.full_name}</p>
            <p><strong>Branch:</strong> {nextRepo.repository.default_branch}</p>
            <p><strong>Latest SHA:</strong> {nextRepo.repository.latest_commit_sha}</p>
            <p>
              <strong>Stars:</strong> {nextRepo.repository.stargazers_count} • <strong>Forks:</strong>{' '}
              {nextRepo.repository.forks_count} • <strong>Open issues:</strong> {nextRepo.repository.open_issues_count}
            </p>
            {nextRepo.repository.description && (
              <p className={styles.description}>{nextRepo.repository.description}</p>
            )}
            {nextRepo.repository.topics.length > 0 && (
              <div className={styles.badgeRow}>
                {nextRepo.repository.topics.map((topic) => (
                  <span key={topic} className={styles.badge}>{topic}</span>
                ))}
              </div>
            )}
            {nextRepo.repository.languages.length > 0 && (
              <div className={styles.commitList}>
                <h3>{nextRepo.repository.name} Languages</h3>
                <ul>
                  {nextRepo.repository.languages.map((language) => (
                    <li key={language.name}>
                      {language.name} — {formatLanguageBytes(language.bytes)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={styles.commitList}>
              <h3>{nextRepo.repository.name} Forecast</h3>
              <ul>
                {nextStorySegments.map((statement, index) => (
                  <li key={index}>{statement}</li>
                ))}
              </ul>
            </div>
            <div className={styles.commitList}>
              <h3>{nextRepo.repository.name} Activity</h3>
              <ul>
                {nextRepo.commits.map((commit) => {
                  const timestamp = formatTimestamp(commit.committed_at);
                  const stats = commitStats(commit);
                  return (
                    <li key={commit.sha}>
                      <div>
                        <code>{commit.sha.slice(0, 7)}</code> — {commit.message}
                      </div>
                      <div className={styles.commitMeta}>
                        {commitAuthor(commit)}
                        {timestamp && <span> • {timestamp}</span>}
                        {stats && <span> • {stats}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
