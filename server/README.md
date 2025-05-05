Food Rescue Network is a full-stack web application connecting food donors (restaurants, grocery stores, individuals) with volunteers and social service organizations to redistribute surplus meals before they go to waste.

Key Features
• Role-based access: Donors can post, edit, and delete “available” food donations; volunteers can browse, claim, and complete pickups.
• Geo-aware search: Volunteers locate nearby donations on a map or via filters (city, food type, expiry).
• Expiration management: Donations automatically expire, and donors see only active listings.
• Email notifications: Configurable alerts (via Gmail/Nodemailer) inform donors and volunteers of status changes.
• Image handling: Donation photos are streamed on demand to speed up page loads.
• Secure API: JWT authentication with role-based middleware guards all endpoints.
• Modern frontend: React + Chakra UI for responsive, accessible dashboards and forms.
• Backend stack: Node.js, Express, MongoDB (Mongoose) with optimized queries and CDN-ready image routes.

With minimal setup (npm install, .env config, npm run build), Food Rescue Network empowers communities to reduce waste and fight hunger in real time.
