import streamlit as st
from gemini_functions import get_key_concepts
import google

st.title("Key concepts")
with st.spinner("Getting key concepts..."):
    if "concepts" not in st.session_state:
        try:
            st.session_state["concepts"] = get_key_concepts()
            st.write(st.session_state["concepts"])
        except google.genai.errors.ServerError:
            st.write("Sorry, the server is busy now. Please, try later")
    else:
        st.write(st.session_state["concepts"])