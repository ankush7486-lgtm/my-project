# --- STAGE 1: Build Stage (React App ko banane ke liye) ---
# Hum Node.js ki ek halki image (alpine) istemal kar rahe hain
FROM node:18-alpine AS build

# Container ke andar /app naam ka folder banao
WORKDIR /app

# Sirf package.json aur package-lock.json copy karo
# Isse Docker caching ka fayda milta hai
COPY package*.json ./

# Dependencies install karo (npm install)
RUN npm install

# Baaki saara code (src, public, etc.) copy karo
COPY . .

# React app ka production build banao (npm run build)
# Isse /app/build folder ban jayega
RUN npm run build


# --- STAGE 2: Production Stage (Sirf app ko chalane ke liye) ---
# Ab hum ek naya, chota server (Nginx) image istemal kar rahe hain
FROM nginx:1.25-alpine

# STAGE 1 se jo /app/build folder bana tha...
# ...use Nginx ke serving folder mein copy karo
COPY --from=build /app/build /usr/share/nginx/html

# Jo humne nginx.conf file banayi thi, use Nginx ke config folder mein copy karo
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Container ka port 80 bahar ke liye open karo
EXPOSE 80

# Container chalu hone par Nginx server ko foreground mein chalao
CMD ["nginx", "-g", "daemon off;"]