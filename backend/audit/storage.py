import sqlite3



class AuditStorage:

    def __init__(self, db_name="audit.db"):

        self.conn = sqlite3.connect(
            db_name,
            check_same_thread=False
        )
        self.create_table()

    def create_table(self):

        cursor = self.conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_events (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            event_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            event_hash TEXT NOT NULL UNIQUE
        )
        """)
        
        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS prevent_delete
        BEFORE DELETE ON audit_events
        BEGIN
            SELECT RAISE(
                FAIL,
                'DELETE not allowed'
            );
        END;
        """)

        cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS prevent_update
        BEFORE UPDATE ON audit_events
        BEGIN
            SELECT RAISE(
                FAIL,
                'UPDATE not allowed'
            );
        END;
        """)

        self.conn.commit()
    
    def insert_event(self, event):

        cursor = self.conn.cursor()

        cursor.execute(
            """
            INSERT INTO audit_events
            (
                event_id,
                user_id,
                session_id,
                event_type,
                timestamp,
                event_hash
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                event.event_id,
                event.user_id,
                event.session_id,
                event.event_type,
                event.timestamp,
                event.hash()
            )
        )

        self.conn.commit()
        
    def get_events_by_user(self, user_id):

        cursor = self.conn.cursor()

        cursor.execute(
            """
            SELECT *
            FROM audit_events
            WHERE user_id = ?
            """,
            (user_id,)
        )

        return cursor.fetchall()
    
    def get_event_hashes_by_user(self, user_id):

        cursor = self.conn.cursor()

        cursor.execute(
            """
            SELECT event_hash
            FROM audit_events
            WHERE user_id = ?
            ORDER BY id
            """,
            (user_id,)
        )

        return [row[0] for row in cursor.fetchall()]
    
    def get_events_with_hashes_by_user(self, user_id):

        cursor = self.conn.cursor()

        cursor.execute(
            """
            SELECT
                event_id,
                event_type,
                timestamp,
                event_hash
            FROM audit_events
            WHERE user_id = ?
            ORDER BY id
            """,
            (user_id,)
        )

        return cursor.fetchall()
        