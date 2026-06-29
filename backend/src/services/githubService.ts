import dotenv from 'dotenv';
dotenv.config();

/**
 * Fetches the recent commit logs for a specific repository using the user's OAuth token.
 * @param token The GitHub provider OAuth access token retrieved from Clerk
 * @param owner The GitHub username or organization name
 * @param repo The name of the repository
 */
export async function fetchRecentCommits(token: string, owner: string, repo: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'DevPulse-Backend-Engine'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `GitHub API responded with status ${response.status}`);
    }

    const commits = await response.json();
    
    // Format the raw GitHub payload into clean metadata for our dashboard
    return commits.map((item: any) => ({
      sha: item.sha.substring(0, 7),
      message: item.commit.message,
      author: item.commit.author.name,
      date: item.commit.author.date,
      url: item.html_url
    }));

  } catch (error: any) {
    console.error(`Error inside GitHub Fetch Service for ${owner}/${repo}:`, error.message);
    throw error;
  }
  
}
/**
 * Fetches all accessible repositories for the authenticated user.
 * @param token The GitHub provider OAuth access token retrieved from Clerk
 */
export async function fetchUserRepositories(token: string) {
  try {
    const response = await fetch(`https://api.github.com/user/repos?per_page=50&sort=updated`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'DevPulse-Backend-Engine'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub Repos API responded with status ${response.status}`);
    }

    const repos = await response.json();
    
    // Extract only the clean properties our interface dropdown needs
    return repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name, // e.g., "username/repo-name"
      owner: r.owner.login
    }));
  } catch (error: any) {
    console.error("Error inside GitHub Repo Service:", error.message);
    throw error;
  }
}