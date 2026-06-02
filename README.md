# FitApp 💪

### Track. Connect. Achieve.

A full-stack fitness tracking and social community platform built with the MERN stack. FitApp lets you log workouts, track nutrition, connect with other athletes, compete in challenges, and stay motivated through a social activity feed.

🌐 **Live Demo:** [https://fitapp-two-ruddy.vercel.app](https://fitapp-two-ruddy.vercel.app)

---


## Features

### 🏋️ Workout Tracking
- Log custom workout sessions with a dynamic exercise logger
- Add multiple exercises per session with sets, reps, and weight tracking
- Pre-populated exercise library with 45+ exercises across 8 muscle groups
- Add custom exercises to your personal library
- View full workout history sorted by date
- Consistency heatmap showing your workout activity over the last 84 days

### 🥗 Nutrition Tracker
- Search millions of food items powered by the **USDA FoodData Central API**
- Log meals under Breakfast, Lunch, Dinner, and Snacks
- Real-time macro counter for Calories, Protein, Carbohydrates, and Fat
- Visual macro progress bars for daily targets
- Daily nutrition summary with date navigation
- View nutrition history across any date range

### 👤 User Profiles
- Customizable profile with fitness goals and physical metrics
- Profile picture upload powered by **Cloudinary**
- Follow and unfollow other athletes
- View followers and following counts
- Activity log showing all posts and workouts

### 📰 Social Feed
- Activity feed showing posts from followed athletes
- Auto-generated workout posts when a session is logged
- Create status update posts
- Like and comment on posts
- Infinite scroll pagination
- Search for other athletes by name

### 🏆 Challenges & Leaderboards
- Create custom fitness challenges with defined timelines
- Three scoring metrics: Total Workouts, Total Minutes, Challenge Points
- Join and leave community challenges
- Submit workouts to earn points
- Real-time leaderboard with gold, silver, and bronze rankings
- Live score updates powered by **Socket.io**

### 🔔 Notifications
- Real-time push notifications for:
  - New followers
  - Post likes
  - Post comments
  - Challenge score updates
- Unread badge count in the sidebar
- Mark individual or all notifications as read
- Filter by read/unread status

### 🔐 Authentication
- Secure JWT-based authentication
- Password hashing with bcrypt
- Protected routes on both frontend and backend
- Auto token refresh and logout on expiry

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Tailwind CSS v3 | Utility-first styling |
| Axios | HTTP client |
| Socket.io Client | Real-time updates |
| React Hot Toast | Toast notifications |
| Chart.js | Data visualization |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | NoSQL database |
| Mongoose | ODM for MongoDB |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| Socket.io | Real-time communication |
| Multer | File upload handling |
| Cloudinary | Image storage and CDN |

### External APIs
| API | Purpose |
|---|---|
| USDA FoodData Central | Food search and nutrition data |
| Cloudinary | Profile picture storage |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Cloud database |

---

## Project Structure

```
fitness-app/
│
├── client/                          # React frontend
│   ├── public/
│   │   └── _redirects               # Vercel routing config
│   └── src/
│       ├── api/
│       │   ├── axiosConfig.js       # Axios instance with interceptors
│       │   └── index.js             # All API call functions
│       ├── components/
│       │   └── common/
│       │       ├── Layout.jsx       # Sidebar + navigation
│       │       ├── ProtectedRoute.jsx
│       │       └── Spinner.jsx
│       ├── context/
│       │   └── AuthContext.js       # Global auth state
│       └── pages/
│           ├── Auth/                # Login & Register
│           ├── Dashboard/           # Home dashboard
│           ├── Profile/             # User profile
│           ├── Workout/             # Workout logger
│           ├── Nutrition/           # Nutrition tracker
│           ├── Feed/                # Social feed
│           ├── Challenges/          # Challenges & leaderboard
│           └── Notifications/       # Notification center
│
└── server/                          # Express backend
    ├── config/
    │   ├── db.js                    # MongoDB connection
    │   └── cloudinary.js            # Cloudinary config
    ├── controllers/                 # Business logic
    │   ├── authController.js
    │   ├── userController.js
    │   ├── workoutController.js
    │   ├── exerciseController.js
    │   ├── nutritionController.js
    │   ├── postController.js
    │   ├── challengeController.js
    │   └── notificationController.js
    ├── middleware/
    │   ├── authMiddleware.js        # JWT verification
    │   └── uploadMiddleware.js      # Multer file upload
    ├── models/                      # Mongoose schemas
    │   ├── User.js
    │   ├── Workout.js
    │   ├── Exercise.js
    │   ├── FoodLog.js
    │   ├── Post.js
    │   ├── Challenge.js
    │   └── Notification.js
    ├── routes/                      # Express route definitions
    ├── seed/
    │   └── exercises.js             # Exercise library seed script
    ├── utils/
    │   ├── generateToken.js         # JWT generator
    │   └── socketManager.js         # Socket.io event manager
    └── index.js                     # Server entry point
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |
| POST | `/api/users/:id/upload` | Upload profile picture |
| POST | `/api/users/:id/follow` | Follow a user |
| DELETE | `/api/users/:id/unfollow` | Unfollow a user |
| GET | `/api/users/search?q=` | Search users |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workouts` | Log a workout |
| GET | `/api/workouts/user/:userId` | Get user workouts |
| GET | `/api/workouts/heatmap/:userId` | Get heatmap data |
| GET | `/api/workouts/:id` | Get single workout |
| PUT | `/api/workouts/:id` | Update workout |
| DELETE | `/api/workouts/:id` | Delete workout |

### Nutrition
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nutrition/search?q=` | Search food items |
| POST | `/api/nutrition/log` | Log a food entry |
| GET | `/api/nutrition/log/:userId/:date` | Get daily log |
| DELETE | `/api/nutrition/log/:entryId` | Delete food entry |
| GET | `/api/nutrition/summary/:userId` | Get date range summary |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create a post |
| GET | `/api/posts/feed` | Get activity feed |
| GET | `/api/posts/user/:userId` | Get user posts |
| PUT | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comment` | Add comment |
| DELETE | `/api/posts/:id` | Delete post |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/challenges` | Create challenge |
| GET | `/api/challenges` | Get all challenges |
| POST | `/api/challenges/:id/join` | Join challenge |
| POST | `/api/challenges/:id/submit` | Submit workout |
| GET | `/api/challenges/:id/leaderboard` | Get leaderboard |
| DELETE | `/api/challenges/:id/leave` | Leave challenge |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/read-all` | Mark all as read |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| DELETE | `/api/notifications/:id` | Delete notification |

---

/a>
  </p>
</div>
