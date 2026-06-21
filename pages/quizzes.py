import streamlit as st
from gemini_functions import get_quizzes

st.title("Quizzes")
st.write("Answer all quizzes and get the feedback")
names = []
with st.spinner("Getting the quizzes..."):
    if "quizzes" not in st.session_state:
        st.session_state["quizzes"] = get_quizzes()
    for i in range(len(st.session_state["quizzes"])):
        answer = st.radio(st.session_state["quizzes"][i]["question"],
                 st.session_state["quizzes"][i]["options"],
                 index=None)
        names.append(answer)
check = st.button("Check my answers")
if check:
    with st.spinner("Checking your answers..."):
        for i in range(len(st.session_state["quizzes"])):
            st.write(f"{i+1}. {st.session_state["quizzes"][i]["question"]}")
            if names[i] == st.session_state["quizzes"][i]["correct"]:
                st.write(f":green[Your answer '{names[i]}' is correct!]")
            else:
                st.write(f":red[Your answer '{names[i]}' is incorrect.]")
                st.write(f":red[Correct answer is '{st.session_state["quizzes"][i]["correct"]}']")