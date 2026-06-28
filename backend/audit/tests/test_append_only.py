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
        DELETE FROM audit_events
        WHERE id = 1
        """
    )

    db.conn.commit()

except Exception as e:

    print(
        "DELETE BLOCKED:",
        e
    )
