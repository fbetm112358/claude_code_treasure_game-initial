const BASE = 'http://localhost:4000';

export async function register(email: string, password: string) {
  const res = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function saveScore(score: number, token: string) {
  const res = await fetch(`${BASE}/api/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ score }),
  });
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${BASE}/api/scores`);
  return res.json();
}
