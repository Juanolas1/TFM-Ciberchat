from typing import List
from django.conf import settings
from langchain_elasticsearch import ElasticsearchStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.schema import Document
from django.conf import settings

"""
Utilidades RAG apoyadas en LangChain + Elasticsearch
"""

try:

    from langchain_community.retrievers.elastic_search_bm25 import (
        ElasticSearchBM25Retriever as BM25Retriever,
    )
except ModuleNotFoundError:

    from langchain_community.retrievers.elasticsearch_bm25 import (
        ElasticSearchBM25Retriever as BM25Retriever,
    )



_embeddings = HuggingFaceEmbeddings(model_name=settings.EMBED_MODEL_NAME)


_vectorstore = ElasticsearchStore(
    embedding=_embeddings,
    index_name=settings.ES_INDEX_NAME,
    es_url=settings.ELASTICSEARCH_HOST,
)




def index_attachment_chunks(user_id, chat_id, message_id, attachment_id,
                            text, chunk_size=256, overlap=64):
    step = chunk_size - overlap
    docs = []
    for i in range(0, len(text), step):
        docs.append(
            Document(
                page_content=text[i:i + chunk_size],
                metadata={
                    "user_id": user_id,
                    "chat_id": chat_id,         
                    "message_id": message_id,
                    "attachment_id": attachment_id,
                },
            )
        )
    _vectorstore.add_documents(docs)



def retrieve_chunks(user_id, chat_id, query, k=20, include_user=False):
    filter_chat = [{"term": {"metadata.chat_id": chat_id}}]
    filter_user = [{"term": {"metadata.user_id": user_id}}]


    bm25 = BM25Retriever(
        client=_vectorstore.client,
        index_name=settings.ES_INDEX_NAME,
    )


    bm_chat = bm25.get_relevant_documents(query, filter=filter_chat, k=k)
    bm_user = bm25.get_relevant_documents(query, filter=filter_user, k=k) if include_user else []


    vec_chat = _vectorstore.similarity_search(query, k=k, filter=filter_chat)
    vec_user = _vectorstore.similarity_search(query, k=k, filter=filter_user) if include_user else []

    seen, ordered = set(), []
    for doc in bm_chat + vec_chat + bm_user + vec_user:
        if doc.page_content not in seen:
            ordered.append(doc.page_content)
            seen.add(doc.page_content)
        if len(ordered) >= k:
            break
    return ordered
