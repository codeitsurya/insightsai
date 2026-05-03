from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from data_loader import load_data
from dotenv import load_dotenv
from openai import OpenAI
import pandas as pd
import numpy as np
import math
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class QueryRequest(BaseModel):
    question: str

def safe_value(value):
    if value is None:
        return ""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return ""
    return value

def clean_records(df):
    df = df.replace({np.nan: ""})
    records = df.to_dict(orient="records")
    return [{k: safe_value(v) for k, v in row.items()} for row in records]

def build_insights():
    data = load_data()

    if "error" in data:
        return {"error": data["error"]}

    df = data["tamil_detail"].copy()
    df.columns = [str(c).strip() for c in df.columns]

    required_cols = [
        "Outlet Name",
        "Distributor",
        "Channel",
        "Revenue As of Date",
        "Compliance Status",
    ]

    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        return {
            "error": "Missing required columns",
            "missing_columns": missing_cols,
            "available_columns": list(df.columns),
        }

    df["Revenue As of Date"] = pd.to_numeric(
        df["Revenue As of Date"], errors="coerce"
    ).fillna(0)

    df["Compliance Status"] = df["Compliance Status"].fillna("Unknown").astype(str)
    df["Outlet Name"] = df["Outlet Name"].fillna("")
    df["Distributor"] = df["Distributor"].fillna("")
    df["Channel"] = df["Channel"].fillna("")

    non_compliant = df[
        df["Compliance Status"].str.lower().str.strip() != "compliant"
    ]

    top_non_compliant = (
        non_compliant[
            [
                "Outlet Name",
                "Distributor",
                "Channel",
                "Revenue As of Date",
                "Compliance Status",
            ]
        ]
        .sort_values("Revenue As of Date", ascending=False)
        .head(10)
    )

    distributor_perf = (
        df.groupby("Distributor", dropna=False)
        .agg(
            outlet_count=("Outlet Name", "count"),
            revenue=("Revenue As of Date", "sum"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
        .head(10)
    )

    channel_perf = (
        df.groupby("Channel", dropna=False)
        .agg(
            outlet_count=("Outlet Name", "count"),
            revenue=("Revenue As of Date", "sum"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
    )

    total_outlets = int(len(df))
    non_compliant_count = int(len(non_compliant))
    total_revenue = float(df["Revenue As of Date"].sum())
    compliance_rate = (
        round(((total_outlets - non_compliant_count) / total_outlets) * 100, 1)
        if total_outlets
        else 0
    )

    return {
        "summary": {
            "total_outlets": total_outlets,
            "non_compliant_outlets": non_compliant_count,
            "total_revenue": total_revenue,
            "compliance_rate": compliance_rate,
        },
        "top_non_compliant_outlets": clean_records(top_non_compliant),
        "top_distributors": clean_records(distributor_perf),
        "channel_performance": clean_records(channel_perf),
    }

def rule_based_answer(question: str, insights: dict):
    q = question.lower().strip()

    summary = insights["summary"]
    outlets = insights["top_non_compliant_outlets"]
    distributors = insights["top_distributors"]
    channels = insights["channel_performance"]

    top_outlet = outlets[0] if outlets else {}
    top_distributor = distributors[0] if distributors else {}
    top_channel = channels[0] if channels else {}

    if "sale" in q or "sales" in q or "revenue" in q:
        answer = (
            f"Total sales tracked in the uploaded dataset is ₹{summary['total_revenue'] / 100000:.2f}L. "
            f"This is based on {summary['total_outlets']} outlets, out of which "
            f"{summary['non_compliant_outlets']} outlets are currently non-compliant. "
            f"The highest contributing channel is {top_channel.get('Channel', 'not available')} "
            f"with revenue of ₹{float(top_channel.get('revenue', 0)):,.0f}."
        )
        root_causes = [
            "Revenue is concentrated in specific channels",
            "Non-compliance may be impacting full sales realization",
            "Execution gaps can directly affect revenue throughput",
        ]
        actions = [
            "Review sales by channel first",
            "Prioritize high-revenue non-compliant outlets",
            "Track revenue recovery after outlet compliance correction",
        ]

    elif "outlet" in q or "prioritize" in q or "fix first" in q:
        answer = (
            f"Insights.ai has identified {summary['non_compliant_outlets']} non-compliant outlets "
            f"out of {summary['total_outlets']} loaded outlets. "
            f"The highest-priority outlet is {top_outlet.get('Outlet Name', 'not available')} "
            f"in channel {top_outlet.get('Channel', 'not available')}, with revenue exposure of "
            f"₹{float(top_outlet.get('Revenue As of Date', 0)):,.0f}. "
            f"Start with the top 10 non-compliant outlets ranked by revenue."
        )
        root_causes = [
            "Outlet-level compliance gap is the largest execution issue",
            "Revenue exposure is concentrated in specific non-compliant outlets",
            "Field action should begin with high-revenue outlets",
        ]
        actions = [
            "Assign sales team to top 10 non-compliant outlets",
            "Verify availability, assortment and execution standards",
            "Track correction status outlet-by-outlet",
        ]

    elif "distributor" in q:
        answer = (
            f"Distributor concentration is visible in the uploaded data. "
            f"The highest revenue distributor is {top_distributor.get('Distributor', 'not available')} "
            f"with {int(top_distributor.get('outlet_count', 0))} outlets and revenue of "
            f"₹{float(top_distributor.get('revenue', 0)):,.0f}. "
            f"This distributor should be reviewed first for outlet compliance, servicing discipline and coverage quality."
        )
        root_causes = [
            "Revenue and outlet base are concentrated with a few distributors",
            "Distributor-level follow-up can unlock faster compliance recovery",
            "Blank distributor mapping needs data hygiene correction",
        ]
        actions = [
            "Review top distributors by revenue and outlet count",
            "Correct blank distributor mapping in the source file",
            "Create distributor-wise compliance recovery tracker",
        ]

    elif "channel" in q or "underperforming" in q:
        answer = (
            f"The channel requiring highest attention is {top_channel.get('Channel', 'not available')}. "
            f"It has {int(top_channel.get('outlet_count', 0))} outlets and revenue of "
            f"₹{float(top_channel.get('revenue', 0)):,.0f}. "
            f"Because this channel has high revenue concentration, even small execution gaps can materially affect sales performance."
        )
        root_causes = [
            "Channel-level revenue concentration creates execution risk",
            "Non-compliance needs to be reviewed by channel",
            "High-revenue channels should receive first field intervention",
        ]
        actions = [
            "Build channel-wise action plan",
            "Prioritize channels based on revenue exposure",
            "Review compliance by channel every week",
        ]

    elif "leadership" in q or "this week" in q or "action" in q:
        answer = (
            f"For sales leadership, the immediate priority is focused execution recovery. "
            f"The system has detected {summary['non_compliant_outlets']} non-compliant outlets, "
            f"a compliance rate of {summary['compliance_rate']}%, and tracked revenue of "
            f"₹{summary['total_revenue'] / 100000:.2f}L. "
            f"The recommended leadership action is to run a weekly recovery cockpit across outlet, distributor and channel."
        )
        root_causes = [
            "Non-compliance is too high for broad manual review",
            "Revenue risk is concentrated in specific channels and distributors",
            "Sales leadership needs exception-led action, not static reporting",
        ]
        actions = [
            "Start with top non-compliant revenue outlets",
            "Hold distributor review for top revenue nodes",
            "Create weekly sales execution recovery rhythm",
        ]

    else:
        return None

    return {
        "answer": answer,
        "root_causes": root_causes,
        "actions": actions,
        "confidence": "88%",
        "mode": "rule_engine",
    }

def ask_anything_answer(question: str, insights: dict):
    context = {
        "summary": insights["summary"],
        "top_non_compliant_outlets": insights["top_non_compliant_outlets"][:10],
        "top_distributors": insights["top_distributors"][:10],
        "channel_performance": insights["channel_performance"][:10],
    }

    prompt = f"""
You are Insights.ai, an executive sales leadership AI copilot.

Use ONLY the data context below. Do not invent numbers, outlets, distributors, channels, or SKUs.
If the data does not contain something, say that the uploaded dataset does not contain that field.

Business context:
This is outlet execution / compliance / sales performance data.
The user is preparing a credible demo for sales leadership.

Data context:
{context}

User question:
{question}

Answer format:
1. Start with the direct answer.
2. Include exact numbers from the data where available.
3. Explain what it means commercially.
4. Give 3 recommended actions.
5. Keep it concise and boardroom-ready.
"""

    completion = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a precise enterprise analytics copilot. Never fabricate data.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    answer = completion.choices[0].message.content

    return {
        "answer": answer,
        "root_causes": [
            "AI response generated from uploaded outlet execution data",
            "Reasoning uses summarized outlet, distributor and channel performance",
            "No external data used",
        ],
        "actions": [
            "Validate priority outputs with sales team",
            "Review high-impact outlet and channel exceptions",
            "Use this as the first leadership demo flow",
        ],
        "confidence": "90%",
        "mode": "ask_anything_ai",
    }

@app.get("/")
def home():
    return {"message": "Insights.ai backend running"}

@app.get("/preview-data")
def preview_data():
    data = load_data()

    if "error" in data:
        return {"error": data["error"]}

    return {
        "tamil_rows": len(data["tamil_detail"]),
        "channel_rows": len(data["channel_summary"]),
        "outlet_rows": len(data["outlet_details"]),
        "tamil_columns": list(data["tamil_detail"].columns),
        "channel_columns": list(data["channel_summary"].columns),
        "outlet_columns": list(data["outlet_details"].columns),
    }

@app.get("/insights")
def get_insights():
    return build_insights()

@app.post("/query")
def query_agent(request: QueryRequest):
    insights = build_insights()

    if "error" in insights:
        return {
            "answer": f"I could not process the uploaded data. Error: {insights['error']}",
            "root_causes": [],
            "actions": [],
            "confidence": "0%",
            "mode": "error",
        }

    rule_answer = rule_based_answer(request.question, insights)

    if rule_answer:
        return rule_answer

    try:
        return ask_anything_answer(request.question, insights)
    except Exception as e:
        return {
            "answer": (
                "I could not reach the AI reasoning layer, but the data engine is working. "
                f"Error: {str(e)}"
            ),
            "root_causes": [
                "OpenAI key may be missing or invalid",
                "Network or model call may have failed",
                "Rule-based data engine remains available",
            ],
            "actions": [
                "Check backend/.env has OPENAI_API_KEY",
                "Restart backend after saving .env",
                "Use standard demo questions meanwhile",
            ],
            "confidence": "60%",
            "mode": "fallback_error",
        }