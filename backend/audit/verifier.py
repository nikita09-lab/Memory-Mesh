
import hashlib


def build_merkle_root(hashes):

    if not hashes:
        return None

    current_level = hashes.copy()

    while len(current_level) > 1:

        if len(current_level) % 2 != 0:
            current_level.append(current_level[-1])

        next_level = []

        for i in range(0, len(current_level), 2):

            combined = (
                current_level[i]
                + current_level[i + 1]
            )

            next_level.append(
                hashlib.sha256(
                    combined.encode()
                ).hexdigest()
            )

        current_level = next_level

    return current_level[0]

def generate_proof_from_hashes(
    hashes,
    index
):

    proof = []

    current_level = hashes.copy()
    current_index = index

    while len(current_level) > 1:

        if len(current_level) % 2 != 0:
            current_level.append(
                current_level[-1]
            )

        sibling_index = (
            current_index + 1
            if current_index % 2 == 0
            else current_index - 1
        )

        proof.append({
            "hash":
                current_level[
                    sibling_index
                ],
            "position":
                "right"
                if current_index % 2 == 0
                else "left"
        })

        next_level = []

        for i in range(
            0,
            len(current_level),
            2
        ):

            combined = (
                current_level[i]
                + current_level[i + 1]
            )

            next_level.append(
                hashlib.sha256(
                    combined.encode()
                ).hexdigest()
            )

        current_index //= 2
        current_level = next_level

    return proof

def generate_deletion_proof(logger, user_id):

    events = logger.get_user_events(user_id)

    hashes = logger.storage.get_event_hashes_by_user(
        user_id
    )

    if not events:
        return {
            "user_id": user_id,
            "event_count": 0,
            "events": [],
            "deletion_confirmed": False
        }

    root = build_merkle_root(hashes)

    proof_data = []

    for index, row in enumerate(events):

        proof = generate_proof_from_hashes(
            hashes,
            index
        )

        proof_data.append(
            {
                "event_id": row[1],
                "event_type": row[4],
                "timestamp": row[5],
                "proof": proof
            }
        )

    return {
        "user_id": user_id,
        "event_count": len(events),
        "merkle_root": root,
        "events": proof_data,
        "deletion_confirmed": True
    }        