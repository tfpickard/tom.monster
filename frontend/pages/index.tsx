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
  };
  commits: Array<{ sha: string; message: string }>;
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

  const surrealStatements = useMemo(() => current?.surreal ?? [], [current]);

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
            <StreetScene scene={current.scene} />
            <div className={styles.commitList}>
              <h3>Surreal Commit Echoes</h3>
              <ul>
                {surrealStatements.map((statement, index) => (
                  <li key={index}>{statement}</li>
                ))}
              </ul>
            </div>
            <div className={styles.commitList}>
              <h3>Recent Commits</h3>
              <ul>
                {current.commits.map((commit) => (
                  <li key={commit.sha}>
                    <code>{commit.sha.slice(0, 7)}</code> — {commit.message}
                  </li>
                ))}
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
            <div className={styles.commitList}>
              <h3>Upcoming Commit Visions</h3>
              <ul>
                {nextRepo.surreal.map((statement, index) => (
                  <li key={index}>{statement}</li>
                ))}
              </ul>
            </div>
            <div className={styles.commitList}>
              <h3>Recent Commits</h3>
              <ul>
                {nextRepo.commits.map((commit) => (
                  <li key={commit.sha}>
                    <code>{commit.sha.slice(0, 7)}</code> — {commit.message}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
