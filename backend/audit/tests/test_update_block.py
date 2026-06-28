import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
from storage import AuditStorage

db = AuditStorage()

cursor = db.conn.cursor()

try:

    cursor.execute(
        """
        UPDATE audit_events
        SET event_type='HACKED'
        WHERE id = 1
        """
    )

    db.conn.commit()

except Exception as e:

    print(
        "UPDATE BLOCKED:",
        e
    )
