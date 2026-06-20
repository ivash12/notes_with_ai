import streamlit as st

st.title("Study with AI")
st.subheader("Download the photo of your notes and get the quizzes to be able to remember what you have learned")

if "photo_path" not in st.session_state:
    uploaded_file = st.file_uploader("Choose an image", type=["jpg", "jpeg", "png"])
    if uploaded_file is not None:
        with open("saved_photo.jpg", "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.session_state["photo_path"] = "saved_photo.jpg"

if "photo_path" in st.session_state:
    st.image(st.session_state["photo_path"])
    st.write("Choose the following option")
    key_concepts = st.button("Key concepts")
    quizzes = st.button("Quizzes")
    another_photo = st.button("Choose another photo")
    if key_concepts:
        st.switch_page("pages/key_concepts.py")
    if quizzes:
        st.switch_page("pages/quizzes.py")
    if another_photo:
        del st.session_state["photo_path"]
        st.rerun()
