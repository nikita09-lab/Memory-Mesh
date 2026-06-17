from dataclasses import dataclass
import hashlib
import json
from storage import AuditStorage


@dataclass
class AuditEvent:
    event_id: str
    user_id: str
    session_id: str
    event_type: str
    timestamp: str

    def hash(self):
        event_json = json.dumps(
            self.__dict__,
            sort_keys=True
        )

        return hashlib.sha256(
            event_json.encode()
        ).hexdigest()


class MerkleTree:

    def __init__(self):
        self.leaves = []

    def add_event(self, event):
        self.leaves.append(event.hash())

    def build_tree(self):

        if not self.leaves:
            return None

        current_level = self.leaves.copy()

        while len(current_level) > 1:

            if len(current_level) % 2 != 0:
                current_level.append(current_level[-1])

            next_level = []

            for i in range(0, len(current_level), 2):

                combined = (
                    current_level[i]
                    + current_level[i + 1]
                )

                new_hash = hashlib.sha256(
                    combined.encode()
                ).hexdigest()

                next_level.append(new_hash)

            current_level = next_level

        return current_level[0]

    def generate_proof(self, index):

        if index >= len(self.leaves):
            raise IndexError("Leaf index out of range")

        proof = []
        current_level = self.leaves.copy()
        current_index = index

        while len(current_level) > 1:

            if len(current_level) % 2 != 0:
                current_level.append(current_level[-1])

            sibling_index = (
                current_index + 1
                if current_index % 2 == 0
                else current_index - 1
            )

            proof.append({
                "hash": current_level[sibling_index],
                "position": (
                    "right"
                    if current_index % 2 == 0
                    else "left"
                )
            })

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

            current_index //= 2
            current_level = next_level

        return proof

    @staticmethod
    def verify_proof(leaf_hash, proof, root):

        current_hash = leaf_hash

        for item in proof:

            if item["position"] == "left":

                combined = (
                    item["hash"]
                    + current_hash
                )

            else:

                combined = (
                    current_hash
                    + item["hash"]
                )

            current_hash = hashlib.sha256(
                combined.encode()
            ).hexdigest()

        return current_hash == root


class AuditLogger:

    def __init__(self):

        self.events = []
        self.tree = MerkleTree()
        self.storage = AuditStorage()

    def log_event(self, event):

        self.events.append(event)
        self.tree.add_event(event)
        self.storage.insert_event(event)

    def get_root(self):

        return self.tree.build_tree()

    def get_user_events(self, user_id):

        return self.storage.get_events_by_user(
            user_id
        )