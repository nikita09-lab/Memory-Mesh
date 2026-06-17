import sqlite3

conn = sqlite3.connect("audit.db")
cursor = conn.cursor()

cursor.execute("SELECT * FROM audit_events")

rows = cursor.fetchall()

for row in rows:
    print(row)

conn.close()
