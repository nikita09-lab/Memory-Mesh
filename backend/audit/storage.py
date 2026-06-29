import psycopg2
import psycopg2.extras
import os


class AuditStorage:

    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        self.create_table()

    def _conn(self):
        conn = psycopg2.connect(self.database_url)
        conn.autocommit = False
        return conn

    def create_table(self):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS audit_events (
                        id         SERIAL PRIMARY KEY,
                        event_id   TEXT NOT NULL,
                        user_id    TEXT NOT NULL,
                        session_id TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        timestamp  TEXT NOT NULL,
                        event_hash TEXT NOT NULL UNIQUE
                    );
                """)
                # Postgres doesn't support SQLite-style RAISE triggers the same way,
                # so we use a rule to block DELETE and UPDATE instead.
                cur.execute("""
                    CREATE OR REPLACE RULE prevent_delete AS
                        ON DELETE TO audit_events DO INSTEAD NOTHING;
                """)
                cur.execute("""
                    CREATE OR REPLACE RULE prevent_update AS
                        ON UPDATE TO audit_events DO INSTEAD NOTHING;
                """)
            conn.commit()

    def insert_event(self, event):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT 1 FROM audit_events WHERE event_hash = %s",
                    (event.hash(),)
                )
                if cur.fetchone():
                    return  # duplicate, skip
                cur.execute(
                    """
                    INSERT INTO audit_events
                        (event_id, user_id, session_id, event_type, timestamp, event_hash)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        event.event_id,
                        event.user_id,
                        event.session_id,
                        event.event_type,
                        event.timestamp,
                        event.hash(),
                    )
                )
            conn.commit()

    def get_events_by_user(self, user_id):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM audit_events WHERE user_id = %s",
                    (user_id,)
                )
                return cur.fetchall()

    def get_event_hashes_by_user(self, user_id):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT event_hash FROM audit_events WHERE user_id = %s ORDER BY id",
                    (user_id,)
                )
                return [row[0] for row in cur.fetchall()]

    def get_events_with_hashes_by_user(self, user_id):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT event_id, event_type, timestamp, event_hash
                    FROM audit_events
                    WHERE user_id = %s
                    ORDER BY id
                    """,
                    (user_id,)
                )
                return cur.fetchall()