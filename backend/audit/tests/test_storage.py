import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
from merkle_log import AuditEvent
from storage import AuditStorage

storage = AuditStorage()

event = AuditEvent(
    event_id="1",
    user_id="user_1",
    session_id="session_1",
    event_type="SESSION_START",
    timestamp="2026-06-16"
)

storage.insert_event(event)

events = storage.get_events_by_user("user_1")

print(events)
