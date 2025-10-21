flowchart TD
    Start[Start] --> SignIn[Sign In Page]
    SignIn --> AuthCheck{Is Admin?}
    AuthCheck -->|Yes| AdminDash[Admin Dashboard]
    AuthCheck -->|No| StudentLogin[Student Login]
    AdminDash --> StudentManage[Manage Students]
    AdminDash --> CandidateManage[Manage Candidates]
    AdminDash --> VotingSettings[Voting Settings]
    AdminDash --> ViewResults[View Results]
    StudentLogin --> TokenCheck{Valid NIS and Token?}
    TokenCheck -->|Yes| VotePage[Voting Page]
    TokenCheck -->|No| AuthError[Authentication Error]
    VotePage --> CastVote[Cast Vote]
    CastVote -->|Success| Confirm[Vote Confirmation]
    CastVote -->|Failure| VoteError[Vote Error]