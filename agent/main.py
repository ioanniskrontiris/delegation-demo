import os, requests

GATEWAY = os.getenv("GATEWAY_URL", "http://localhost:8080")
# pretend we got a user/agent token from somewhere (demo only)
DEMO_ACCESS_TOKEN = "demo-user-access-token"

def main():
    print("Agent starting…")
    # call gateway to mint a short-lived assertion bound to a session
    r = requests.post(f"{GATEWAY}/assert", headers={"Authorization": f"Bearer {DEMO_ACCESS_TOKEN}"})
    r.raise_for_status()
    assertion = r.json()["assertion"]

    # now call the tool THROUGH the gateway, presenting the assertion
    rr = requests.get(f"{GATEWAY}/tool/echo?msg=hello", headers={"Authorization": f"Bearer {assertion}"})
    print("Tool reply:", rr.json())

if __name__ == "__main__":
    main()