import streamlit as st

st.title("Study with AI")
st.subheader("Download the photo of your notes and get the quizes to be able to remember what you have learned")

uploaded_file = st.file_uploader("Choose an image", type=["jpg", "jpeg", "png"])
if uploaded_file is not None:
    st.image(uploaded_file)