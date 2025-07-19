# Dockerfile
FROM node:20-alpine
RUN npm install -g @anthropic-ai/claude-code
EXPOSE 54545
ENTRYPOINT ["claude"]
