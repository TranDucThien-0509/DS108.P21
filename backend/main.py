# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import date

from utils import HotelOptimizer, LichTrinhItem, OptimalHotelRequest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load and prepare data once
optimizer = HotelOptimizer(data_path=r"C:\Users\Admin\Documents\Uni\DS108\Data\Silver Data\Silver_Data.csv")

@app.get("/hotels")
def get_hotels():
    return optimizer.df.to_dict(orient="records")

@app.post("/optimal-hotels")
def optimal_hotels(req: OptimalHotelRequest):
    return optimizer.recommend(req)


# uvicorn main:app --reload