import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
from merkle_log import AuditLogger, AuditEvent

logger = AuditLogger()

events = [
    AuditEvent("1", "u1", "s1", "SESSION_START", "2026"),
    AuditEvent("2", "u1", "s1", "ANSWER_GENERATED", "2026"),
    AuditEvent("3", "u1", "s1", "KEY_WIPED", "2026"),
]

for event in events:
    logger.log_event(event)

print(logger.get_user_events("u1"))