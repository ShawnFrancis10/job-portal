const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Set up session
app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
  })
);

// Navigation menu HTML snippet
const navMenu = `
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/post-job">Post a Job</a></li>
    <li><a href="/jobs">Jobs</a></li>
    <li><a href="/logout">Logout</a></li>
  </ul>
</nav>
`;

// Serve index.html
app.get("/", (req, res) => {
  res.send(`
    ${navMenu}
    <h1>Welcome to the Job Portal</h1>
    <p>Register or log in to start using the job portal.</p>
    <a href="/register">Register</a> | <a href="/login">Login</a>
  `);
});

// Registration route
app.get("/register", (req, res) => {
  res.send(`
    ${navMenu}
    <h2>Register</h2>
    <form action="/register" method="POST">
      <input type="text" name="username" placeholder="Username" required><br>
      <input type="password" name="password" placeholder="Password" required><br>
      <button type="submit">Register</button>
    </form>
    <a href="/">Back to Home</a>
  `);
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store the user
  users.push({ username, password: hashedPassword });

  res.send("Registration successful! <a href='/login'>Log in</a>");
});

// Login route
app.get("/login", (req, res) => {
  res.send(`
    ${navMenu}
    <h2>Login</h2>
    <form action="/login" method="POST">
      <input type="text" name="username" placeholder="Username" required><br>
      <input type="password" name="password" placeholder="Password" required><br>
      <button type="submit">Login</button>
    </form>
    <a href="/">Back to Home</a>
  `);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Find the user
  const user = users.find((user) => user.username === username);

  if (!user) {
    return res.send("User not found");
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch) {
    req.session.user = user;
    res.redirect("/dashboard");
  } else {
    res.send("Incorrect password");
  }
});

// Dashboard route
app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    res.send(`
      ${navMenu}
      <h1>Welcome, ${req.session.user.username}</h1>
      <a href="/post-job">Post a Job</a> | <a href="/jobs">Jobs</a> | <a href="/logout">Logout</a>
    `);
  } else {
    res.send("You need to log in first");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error logging out");
    }
    res.redirect("/");
  });
});

// Post Job route
app.get("/post-job", (req, res) => {
  if (req.session.user) {
    res.send(`
      ${navMenu}
      <h2>Post a New Job</h2>
      <form action="/submit-job" method="POST">
        <input type="text" name="title" placeholder="Job Title" required><br>
        <textarea name="description" placeholder="Job Description" required></textarea><br>
        <input type="text" name="company" placeholder="Company Name" required><br>
        <input type="text" name="location" placeholder="Location" required><br>
        <button type="submit">Post Job</button>
      </form>
      <a href="/dashboard">Back to Dashboard</a>
    `);
  } else {
    res.send("You need to log in first.");
  }
});

const jobs = [];

// Submit Job route
app.post("/submit-job", (req, res) => {
  const { title, description, company, location } = req.body;

  // Save the job to the jobs array
  jobs.push({
    title,
    description,
    company,
    location,
    postedBy: req.session.user.username,
  });

  res.send('Job posted successfully! <a href="/jobs">View Jobs</a>');
});

// Jobs route
app.get("/jobs", (req, res) => {
  let jobList = `
      ${navMenu}
      <h2>Available Jobs</h2>
      <form action="/search-jobs" method="GET">
        <input type="text" name="query" placeholder="Search jobs by title or company">
        <button type="submit">Search</button>
      </form>
      <hr>
  `;

  if (jobs.length === 0) {
    jobList += "No jobs posted yet.";
  } else {
    jobs.forEach((job, index) => {
      jobList += `
              <div>
                  <h3>${job.title}</h3>
                  <p>${job.description}</p>
                  <p>Company: ${job.company}</p>
                  <p>Location: ${job.location}</p>
                  <p>Posted by: ${job.postedBy}</p>
                  <a href="/apply/${index}">Apply Now</a>
              </div>
              <hr>
          `;
    });
  }
  res.send(jobList);
});

// Search Jobs route
app.get("/search-jobs", (req, res) => {
  const query = req.query.query.toLowerCase();
  let filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query)
  );

  if (filteredJobs.length === 0) {
    res.send("No matching jobs found.");
  } else {
    let jobList = `
      ${navMenu}
      <h2>Search Results</h2>
    `;
    filteredJobs.forEach((job) => {
      jobList += `
              <div>
                  <h3>${job.title}</h3>
                  <p>${job.description}</p>
                  <p>Company: ${job.company}</p>
                  <p>Location: ${job.location}</p>
                  <p>Posted by: ${job.postedBy}</p>
              </div>
              <hr>
          `;
    });
    res.send(jobList);
  }
});

// Apply for Job route
app.get("/apply/:id", (req, res) => {
  const jobId = parseInt(req.params.id); // Ensure jobId is an integer
  const job = jobs[jobId];

  if (job) {
    res.send(`
      ${navMenu}
      <h2>Apply for ${job.title}</h2>
      <form action="/submit-application/${jobId}" method="POST">
        <input type="text" name="name" placeholder="Your Name" required><br>
        <input type="email" name="email" placeholder="Your Email" required><br>
        <textarea name="coverLetter" placeholder="Cover Letter" required></textarea><br>
        <button type="submit">Submit Application</button>
      </form>
      <a href="/jobs">Back to Jobs</a>
    `);
  } else {
    res.send("Job not found");
  }
});

const applications = [];

// Submit Application route
app.post("/submit-application/:id", (req, res) => {
  const jobId = parseInt(req.params.id); // Ensure jobId is an integer
  const { name, email, coverLetter } = req.body;

  // Find the job and save the application
  const job = jobs[jobId];
  if (job) {
    applications.push({
      jobId,
      name,
      email,
      coverLetter,
    });
    res.send("Application submitted successfully!");
  } else {
    res.send("Job not found");
  }
});

// View Applications route
app.get("/view-applications/:id", (req, res) => {
  const jobId = parseInt(req.params.id); // Ensure jobId is an integer
  const job = jobs[jobId];

  if (job) {
    // Filter applications for this job
    const jobApplications = applications.filter((app) => app.jobId === jobId);

    let applicationList = `
      ${navMenu}
      <h2>Applications for ${job.title}</h2>
    `;
    if (jobApplications.length === 0) {
      applicationList += "<p>No applications yet.</p>";
    } else {
      jobApplications.forEach((app) => {
        applicationList += `
                  <div>
                      <p><strong>Name:</strong> ${app.name}</p>
                      <p><strong>Email:</strong> ${app.email}</p>
                      <p><strong>Cover Letter:</strong> ${app.coverLetter}</p>
                  </div>
                  <hr>
              `;
      });
    }

    res.send(applicationList);
  } else {
    res.send("Job not found");
  }
});

// Start the server
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
