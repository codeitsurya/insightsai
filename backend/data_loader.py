import os
import pandas as pd

DATA_PATH = os.path.join(os.path.dirname(__file__), "data")

def find_header_row(df):
    for i in range(10):
        row = df.iloc[i].astype(str).str.lower()
        if any("outlet" in str(x) for x in row) or any("channel" in str(x) for x in row):
            return i
    return 0

def load_data():
    try:
        tamil_file = os.path.join(DATA_PATH, "Tamil Nadu (2).xlsx")
        compliance_file = os.path.join(
            DATA_PATH,
            "APT P&G SILVER BRONZE Outlets Compliance JAN MTD 21.xlsb"
        )

        # --- Tamil file ---
        tamil_raw = pd.read_excel(
            tamil_file,
            sheet_name="GreenDetailReport2021",
            engine="openpyxl",
            nrows=200
        )

        tamil_header = find_header_row(tamil_raw)
        tamil_detail = pd.read_excel(
            tamil_file,
            sheet_name="GreenDetailReport2021",
            engine="openpyxl",
            header=tamil_header,
            nrows=500
        )

        # --- Outlet Details ---
        outlet_raw = pd.read_excel(
            compliance_file,
            sheet_name="Outlet wise Details",
            engine="pyxlsb",
            nrows=200
        )

        outlet_header = find_header_row(outlet_raw)
        outlet_details = pd.read_excel(
            compliance_file,
            sheet_name="Outlet wise Details",
            engine="pyxlsb",
            header=outlet_header,
            nrows=500
        )

        # --- Channel Summary ---
        channel_raw = pd.read_excel(
            compliance_file,
            sheet_name="P&G -Channel summary",
            engine="pyxlsb",
            nrows=200
        )

        channel_header = find_header_row(channel_raw)
        channel_summary = pd.read_excel(
            compliance_file,
            sheet_name="P&G -Channel summary",
            engine="pyxlsb",
            header=channel_header,
            nrows=200
        )

        return {
            "tamil_detail": tamil_detail,
            "channel_summary": channel_summary,
            "outlet_details": outlet_details
        }

    except Exception as e:
        return {"error": str(e)}