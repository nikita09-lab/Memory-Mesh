import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
from merkle_log import AuditEvent, AuditLogger

logger = AuditLogger()

event1 = AuditEvent(
    event_id="1",
    user_id="u1",
    session_id="s1",
    event_type="SESSION_START",
    timestamp="2026-06-16"
)

event2 = AuditEvent(
    event_id="2",
    user_id="u1",
    session_id="s1",
    event_type="ANSWER_GENERATED",
    timestamp="2026-06-16"
)
event3 = AuditEvent(
    event_id="3",
    user_id="u1",
    session_id="s1",
    event_type="KEY_WIPED",
    timestamp="2026-06-16"
)



logger.log_event(event1)
logger.log_event(event2)
logger.log_event(event3)



print(logger.get_root())
