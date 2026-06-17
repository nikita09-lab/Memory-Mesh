import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
from fastapi import FastAPI
from audit_api import router

app = FastAPI()

app.include_router(router)