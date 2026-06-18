import streamlit as st
from PIL import Image

st.title("Study with AI")
st.subheader("Download the photo of your notes and get the quizes to be able to remember what you have learned")

uploaded_file = st.file_uploader("Choose an image", type=["jpg", "jpeg", "png"])
if uploaded_file is not None:
    image = Image.open(uploaded_file)
    st.write("Choose the following option")
    key_concepts = st.button("Key concepts")
    quizes = st.button("Quizes")
    if key_concepts:
        st.switch_page("pages/key_concepts.py")
    if quizes:
        st.switch_page("pages/quizes.py")