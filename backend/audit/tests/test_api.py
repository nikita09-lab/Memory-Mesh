import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
from audit_api import router
from fastapi import FastAPI

app = FastAPI()

app.include_router(router)
