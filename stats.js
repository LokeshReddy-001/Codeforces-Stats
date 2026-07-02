const params = new URLSearchParams(window.location.search);
const username = params.get('user');
const loader = document.getElementById('loader');
const dashboard = document.getElementById('dashboard');
const start = Date.now();

Promise.all([
    fetch(
        `https://codeforces.com/api/user.info?handles=${username}`
    ).then(res => res.json()),

    fetch(
        `https://codeforces.com/api/user.status?handle=${username}`
    ).then(res => res.json()),

    fetch(
        `https://codeforces.com/api/user.rating?handle=${username}`
    ).then(res => res.json())
])

.then(([userData, statusData, ratingData]) => {

    const elapsed = Date.now() - start;
    const remaining = Math.max(0, 2000 - elapsed);

    setTimeout(() => {
        if (userData.status === "OK") {
            const user = userData.result[0];
            const submissions = statusData.result;
            fillHeader(user);
            fillRecent(submissions);
            countSolved(submissions);
            const difficultyData = getDifficulty(submissions);
            const tagData = analyzeTags(submissions);
            fillTags(tagData);
            createRatingGraph(ratingData.result);
            createDifficultyChart(difficultyData);
            createSubmissionChart(submissions);
            loader.style.display = 'none';
            dashboard.style.display = 'block';
        }
        else {
            window.location.href =
                "index.html?error=invalid";
        }

    }, remaining);
})
.catch(() => {
    window.location.href =
        "index.html?error=invalid";
});
function fillHeader(user) {

    document.getElementById("username")
        .textContent = user.handle;

    document.getElementById("rating")
        .textContent =
        `Rating: ${user.rating || "Unrated"}`;

    document.getElementById("max-rating")
        .textContent =
        `Max Rating: ${user.maxRating || "Unrated"}`;

    document.querySelector(".user-info img")
        .src = user.avatar;

    document.getElementById("cf-profile-link")
        .href =
        `https://codeforces.com/profile/${user.handle}`;
}

function fillRecent(submissions){
    const container =
        document.getElementById(
            "recent-submissions-container"
        );
    container.innerHTML = "";
    submissions.slice(0,5).forEach(sub => {
        const problem = sub.problem;
        let verdictClass = "";
        let verdictText = "";
        if(sub.verdict === "OK"){
            verdictClass = "accepted";
            verdictText = "✓ Accepted";
        }
        else if(sub.verdict === "WRONG_ANSWER"){
            verdictClass = "wrong";
            verdictText = "✗ Wrong Answer";
        }
        else if(sub.verdict === "TIME_LIMIT_EXCEEDED"){
            verdictClass = "tle";
            verdictText = "⏳ Time Limit";
        }
        else{
            verdictClass = "other";
            verdictText =
                sub.verdict.replaceAll("_", " ");
        }

        container.innerHTML += `
        <a class="submission-box"
           target="_blank"
           href="https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}">
            <h3>${problem.name}</h3>
            <span class="verdict ${verdictClass}">
                ${verdictText}
            </span>
        </a>
        `;
    });
}

function countSolved(submissions){
    const solved = new Set();
    submissions.forEach(sub => {
        if(sub.verdict === "OK"){
            
            solved.add(
                `${sub.problem.contestId}-${sub.problem.index}`
            );
        }
    });
    document.getElementById(
        "problems-solved"
    ).textContent =
    `Total Problems Solved: ${solved.size}`;
}

function getDifficulty(submissions){
    const diff = {};
    submissions.forEach(sub => {
        if(
            sub.verdict === "OK" &&
            sub.problem.rating
        ){
            const r = sub.problem.rating;
            diff[r] =
                (diff[r] || 0) + 1;
        }
    });
    return diff;
}

function analyzeTags(submissions){
    const tags = {};
    submissions.forEach(sub => {
        if(sub.verdict === "OK"){
            sub.problem.tags.forEach(tag => {
                tags[tag] =
                    (tags[tag] || 0) + 1;
            });
        }
    });

    return tags;
}
function fillTags(tags) {
    const container = document.getElementById("tag-container");
    container.innerHTML = "";

    const sorted = Object.entries(tags)
        .sort((a, b) => b[1] - a[1]);

    [...sorted.slice(0, 3), ...sorted.slice(-2)].forEach(([tag, count]) => {

        let strength = "Weak";
        let color = "red";

        if (count >= 20) {
            strength = "Strong";
            color = "green";
        } else if (count >= 10) {
            strength = "Average";
            color = "orange";
        }

        container.innerHTML += `
        <a class="tag-box-last"
           target="_blank"
           href="https://codeforces.com/problemset?tags=${tag}">
            <h3>${tag}</h3>
            <p>${count} solved</p>
            <div style="color:${color}">
                ${strength}
            </div>
        </a>
        `;
    });
}
function createRatingGraph(contests){
    const labels =
        contests.map(c => c.contestName);
    const ratings =
        contests.map(c => c.newRating);
    new Chart(
        document.getElementById("ratingGraph"),
        {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Rating",
                    data: ratings,
                    borderColor: "#2563eb",
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins:{
                    legend:{
                        display:false
                    }
                }
            }
        }
    );
}
function createDifficultyChart(diff){
    new Chart(
        document.getElementById("difficultyGraph"),
        {
            type:"bar",
            data:{
                labels:Object.keys(diff),
                datasets:[{
                    label:"Solved",
                    data:Object.values(diff)
                }]
            },
            options:{
                responsive:true
            }
        }
    );
}
function createSubmissionChart(submissions){
    const verdicts = {};
    submissions.forEach(sub => {

        const v = sub.verdict;
        verdicts[v] =
            (verdicts[v] || 0) + 1;
    });
    new Chart(
        document.getElementById("submissionGraph"),
        {
            type:"pie",
            data:{
                labels:Object.keys(verdicts),
                datasets:[{
                    data:Object.values(verdicts)
                }]
            }
        }
    );
}