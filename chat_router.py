import json
import os
from dataclasses import dataclass
from typing import List

import openai
import requests
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")


@dataclass
class SearchResult:
    title: str
    link: str
    snippet: str

    def __str__(self) -> str:
        return f"{self.title}\n{self.link}\n{self.snippet}"


def classify_prompt(prompt: str) -> str:
    """Classify prompt using gpt-4o model. Returns one of: simple, reasoning, internet_search."""
    system = (
        "You are a classification assistant. Respond ONLY with JSON like {\"type\": \"simple\"}.\n"
        "Types:\n"
        "- simple: single-step question that can be answered directly\n"
        "- reasoning: requires multi-step reasoning or logic\n"
        "- internet_search: requires up-to-date information not in the prompt."
    )
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt},
    ]
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=messages,
        temperature=0,
    )
    content = response["choices"][0]["message"]["content"].strip()
    data = json.loads(content)
    return data.get("type")


def google_search(query: str, num_results: int = 3) -> List[SearchResult]:
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": GOOGLE_API_KEY,
        "cx": GOOGLE_CSE_ID,
        "q": query,
        "num": num_results,
    }
    res = requests.get(url, params=params)
    res.raise_for_status()
    items = res.json().get("items", [])
    results = [
        SearchResult(
            title=item.get("title", ""),
            link=item.get("link", ""),
            snippet=item.get("snippet", ""),
        )
        for item in items
    ]
    return results


def answer_simple(prompt: str, model: str) -> str:
    messages = [{"role": "user", "content": prompt}]
    resp = openai.ChatCompletion.create(model=model, messages=messages)
    return resp["choices"][0]["message"]["content"]


def answer_with_search(prompt: str) -> str:
    results = google_search(prompt)
    formatted = "\n\n".join(str(r) for r in results)
    messages = [
        {
            "role": "system",
            "content": (
                "Use the following Google search results to answer the question."
            ),
        },
        {"role": "user", "content": f"Search results:\n{formatted}\n\nQuestion: {prompt}"},
    ]
    resp = openai.ChatCompletion.create(model="gpt-4o", messages=messages)
    return resp["choices"][0]["message"]["content"]


def chat(prompt: str) -> str:
    kind = classify_prompt(prompt)
    if kind == "simple":
        return answer_simple(prompt, "gpt-4o-mini")
    if kind == "reasoning":
        return answer_simple(prompt, "o4-mini")
    if kind == "internet_search":
        return answer_with_search(prompt)
    raise ValueError(f"Unknown classification: {kind}")


if __name__ == "__main__":
    user_prompt = input("You: ")
    print(chat(user_prompt))
