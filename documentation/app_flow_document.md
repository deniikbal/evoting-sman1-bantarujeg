# App Flow Document for SMAN 1 Bantarujeg E-Voting Application

## Onboarding and Sign-In/Sign-Up

When a first-time visitor arrives at the application, they reach a simple landing page that offers two distinct login paths: one for administrators and one for students. The administrator path leads to an email and password sign-in form, with a link to reset a forgotten password. When an admin clicks the forgot-password link, they are prompted to enter their email, receive a reset link, and then set a new password before returning to the sign-in page. The student path leads to a custom form requesting their NIS (student identification number) and a voting token. There is no public student sign-up, since tokens and accounts are preconfigured by the admin. Both the admin sign-in and the student sign-in forms submit to the same authentication API endpoint, which branches logic based on the type of credentials provided. Successful sign-in sets an authentication cookie and redirects the user to their respective home page. A sign-out link is present in the header of both views, clearing the session and returning the user to the landing page.

## Main Dashboard or Home Page

After an administrator signs in, they land on the Admin Dashboard, which features a persistent sidebar containing links labeled Dashboard Overview, Students, Voting, and Settings. At the top of the page a header displays the school logo, the administrator’s name, and a button for signing out. The main panel of the Dashboard Overview page shows summary cards with the number of students, active elections, and recent voting activity. Students who log in are taken directly to the Student Voting page. This page displays a header with a theme switcher for light and dark modes, the student’s name, and a logout button. Below the header, candidate options appear as selectable cards arranged responsively, allowing the student to choose one candidate and submit a vote.

## Detailed Feature Flows and Page Transitions

### Administrator: Student Management

When the administrator clicks the Students link in the sidebar, the app navigates to the student management page. This page fetches the full list of students from the database and displays it in a sortable table. Above the table, a form allows the admin to upload a CSV file of student records or to manually enter a new student’s details. Upon submitting either action, the system validates the data, creates or updates student entries, and generates a unique token for each student who has none. A confirmation message appears at the top when the operation succeeds, and the list refreshes automatically.

### Administrator: Candidate Management and Live Results

Clicking the Voting link in the sidebar takes the administrator to the candidate management view. This page shows current candidates in a table with options to add, edit, or remove entries. Selecting the add action displays a dialog where the admin can upload a photo, enter the candidate’s name, and write a mission statement. Once saved, the interface returns to the list. Beneath the candidate table, a live results panel dynamically fetches vote counts from the database and updates every few seconds, giving a real-time view of the election status.

### Administrator: Election Settings

When the admin selects Settings in the sidebar, they reach a page containing controls to configure the election period. A toggle switch labeled Voting Status allows the admin to open or close voting. There is also a date picker for setting the start and end times of the election. Saving these settings updates a flag in the database that the voting API checks before accepting any new votes.

### Student: Casting a Vote

After a student logs in, they land on the voting interface. The page loads candidate data and renders each contender as a card with an image, name, and mission statement. Below the cards is a submit button that remains disabled until the student selects exactly one candidate. When the student makes a selection and clicks Vote, the app calls a secure API endpoint. The endpoint verifies that the voting period is active, the student has not already voted, and the provided token is valid and unused. If all checks pass, the vote is recorded in the database, the token is marked as used, and the student’s has_voted flag is set. The page then displays a confirmation screen thanking the student and offering a logout button.

## Settings and Account Management

Administrators can manage their own account details by clicking their name in the header and selecting Profile. This leads to a page where they can change their display name, update their email, or modify their password by entering the current and new passwords. After saving changes, a toast message confirms success. Students have no profile settings beyond logging out, as their account information is managed exclusively by administrators.

## Error States and Alternate Paths

If an administrator or student enters invalid credentials at sign-in, an inline error message appears beneath the form explaining whether the email or password is incorrect, or if the NIS or token is invalid. If the network connection drops, both admin and student pages display a banner indicating connectivity issues and automatically retry once the connection is restored. During student voting, if the election is closed or the token is already used, the API returns an error that appears as a dialog explaining the problem. From any error state, the user can retry the action or return to the main page using a back link.

## Conclusion and Overall App Journey

In summary, a first-time visitor chooses admin or student login and provides the correct credentials. Administrators arrive at a dashboard where they can manage students, generate tokens, set up candidates, and control the voting period. Students log in with their NIS and token, see a clear voting interface, and cast their vote in a single step. Both user roles enjoy a consistent theme and responsive design, with robust error handling guiding them back on track if anything goes wrong. The end goal for administrators is to configure and monitor a secure election, and for students to participate by casting a single, verifiable vote.