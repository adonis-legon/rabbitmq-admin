#!/bin/bash

# RabbitMQ Admin Release Management Script
# Handles creating, listing, and checking release status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="adonis-legon"
REPO_NAME="rabbitmq-admin"
GITHUB_API="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME"

log() {
    echo -e "$1"
}

error() {
    log "${RED}✗ Error:${NC} $1"
    exit 1
}

success() {
    log "${GREEN}✓${NC} $1"
}

info() {
    log "${BLUE}ℹ${NC} $1"
}

warn() {
    log "${YELLOW}⚠${NC} $1"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
    fi
}

# Check if working directory is clean
check_working_directory() {
    if [ -n "$(git status --porcelain)" ]; then
        warn "Working directory has uncommitted changes"
        echo "Current status:"
        git status --short
        echo ""
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Aborted by user"
        fi
    fi
}

# Validate version format
validate_version() {
    local version=$1
    if [[ ! $version =~ ^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
        error "Invalid version format: $version. Use semantic versioning (e.g., v1.0.0, 1.2.3, v2.0.0-beta.1)"
    fi
}

# Normalize version (add 'v' prefix if missing)
normalize_version() {
    local version=$1
    if [[ ! $version =~ ^v ]]; then
        echo "v$version"
    else
        echo "$version"
    fi
}

# Get current version from POM
get_pom_version() {
    if command -v mvn &> /dev/null; then
        local pom_version=$(mvn help:evaluate -Dexpression=project.version -q -DforceStdout 2>/dev/null || echo "")
        if [ -n "$pom_version" ] && [ "$pom_version" != "unknown" ]; then
            echo "$pom_version"
        else
            error "Could not read version from POM file"
        fi
    else
        # Fallback to grep if Maven is not available
        local pom_version=$(grep -m 1 "<version>" pom.xml | sed 's/.*<version>\(.*\)<\/version>.*/\1/' | tr -d ' ')
        if [ -n "$pom_version" ]; then
            echo "$pom_version"
        else
            error "Could not read version from POM file and Maven is not available"
        fi
    fi
}

# Check if tag already exists
check_tag_exists() {
    local tag=$1
    if git tag --list | grep -q "^$tag$"; then
        error "Tag '$tag' already exists"
    fi
    
    # Check remote tags too
    if git ls-remote --tags origin | grep -q "refs/tags/$tag$"; then
        error "Tag '$tag' already exists on remote"
    fi
}

# Get current branch
get_current_branch() {
    git branch --show-current
}

# Create release
create_release() {
    local version=$1
    
    if [ -z "$version" ]; then
        info "No version specified, using version from POM file..."
        version=$(get_pom_version)
        success "Found version in POM: $version"
    fi
    
    validate_version "$version"
    version=$(normalize_version "$version")
    
    check_git_repo
    check_working_directory
    check_tag_exists "$version"
    
    local current_branch=$(get_current_branch)
    
    info "Creating release $version from branch: $current_branch"
    echo ""
    
    # Ensure we're up to date
    info "Fetching latest changes..."
    git fetch origin
    
    # Create and push the tag
    info "Creating tag $version..."
    git tag -a "$version" -m "Release $version"
    
    info "Pushing tag to remote..."
    git push origin "$version"
    
    success "Release $version created and pushed!"
    echo ""
    info "GitHub Actions will now:"
    echo "  1. Run unit tests"
    echo "  2. Run integration tests (if on main branch)"
    echo "  3. Build JAR file"
    echo "  4. Create GitHub release"
    echo "  5. Upload JAR as release asset"
    echo ""
    info "Check the progress at: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
    echo ""
    info "Once complete, the release will be available at:"
    echo "  https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$version"
}

# List recent releases
list_releases() {
    local limit=${1:-10}
    
    info "Fetching recent releases..."
    
    if command -v curl &> /dev/null; then
        local releases=$(curl -s "$GITHUB_API/releases?per_page=$limit")
        
        if echo "$releases" | grep -q "\"message\""; then
            error "Failed to fetch releases from GitHub API"
        fi
        
        echo ""
        log "${GREEN}Recent Releases:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Parse and display releases
        echo "$releases" | python3 -c "
import json, sys, datetime
try:
    releases = json.load(sys.stdin)
    if not releases:
        print('No releases found')
        sys.exit(0)
    
    for i, release in enumerate(releases[:$limit]):
        tag = release['tag_name']
        name = release['name'] or tag
        published = release['published_at']
        if published:
            dt = datetime.datetime.strptime(published, '%Y-%m-%dT%H:%M:%SZ')
            date_str = dt.strftime('%Y-%m-%d %H:%M')
        else:
            date_str = 'Draft'
        
        draft = ' (DRAFT)' if release['draft'] else ''
        prerelease = ' (PRE-RELEASE)' if release['prerelease'] else ''
        
        assets = len(release.get('assets', []))
        asset_str = f' • {assets} asset(s)' if assets > 0 else ''
        
        print(f'{tag:15} {name}{draft}{prerelease}')
        print(f'{\"\":15} {date_str}{asset_str}')
        if i < len(releases) - 1 and i < $limit - 1:
            print()
except Exception as e:
    print('Error parsing releases:', str(e))
    sys.exit(1)
"
    else
        error "curl is required to fetch releases from GitHub API"
    fi
}

# Check release status
check_status() {
    local version=${1}
    
    if [ -n "$version" ]; then
        version=$(normalize_version "$version")
        info "Checking status for release: $version"
        
        # Check if tag exists locally
        if git tag --list | grep -q "^$version$"; then
            success "Tag $version exists locally"
        else
            warn "Tag $version not found locally"
        fi
        
        # Check if tag exists on remote
        if git ls-remote --tags origin | grep -q "refs/tags/$version$"; then
            success "Tag $version exists on remote"
        else
            warn "Tag $version not found on remote"
        fi
        
        # Check GitHub release
        if command -v curl &> /dev/null; then
            local release=$(curl -s "$GITHUB_API/releases/tags/$version")
            
            if echo "$release" | grep -q "\"message\": \"Not Found\""; then
                warn "GitHub release not found for $version"
            else
                success "GitHub release exists for $version"
                
                # Show release info
                echo "$release" | python3 -c "
import json, sys, datetime
try:
    release = json.load(sys.stdin)
    
    print()
    print('Release Information:')
    print('━━━━━━━━━━━━━━━━━━━━━━')
    print(f'Tag: {release[\"tag_name\"]}')
    print(f'Name: {release[\"name\"]}')
    
    published = release.get('published_at')
    if published:
        dt = datetime.datetime.strptime(published, '%Y-%m-%dT%H:%M:%SZ')
        print(f'Published: {dt.strftime(\"%Y-%m-%d %H:%M UTC\")}')
    
    if release.get('draft'):
        print('Status: DRAFT')
    elif release.get('prerelease'):
        print('Status: PRE-RELEASE')
    else:
        print('Status: PUBLISHED')
    
    assets = release.get('assets', [])
    print(f'Assets: {len(assets)}')
    
    if assets:
        print()
        print('Assets:')
        for asset in assets:
            size_mb = asset['size'] / (1024 * 1024)
            print(f'  • {asset[\"name\"]} ({size_mb:.1f} MB)')
    
except Exception as e:
    print('Error parsing release info:', str(e))
    sys.exit(1)
"
            fi
        fi
    else
        # Show latest release info
        info "Checking latest release status..."
        
        if command -v curl &> /dev/null; then
            local latest=$(curl -s "$GITHUB_API/releases/latest")
            
            if echo "$latest" | grep -q "\"message\": \"Not Found\""; then
                warn "No releases found"
            else
                success "Latest release found"
                
                echo "$latest" | python3 -c "
import json, sys, datetime
try:
    release = json.load(sys.stdin)
    
    print()
    print('Latest Release:')
    print('━━━━━━━━━━━━━━━')
    print(f'Tag: {release[\"tag_name\"]}')
    print(f'Name: {release[\"name\"]}')
    
    published = release.get('published_at')
    if published:
        dt = datetime.datetime.strptime(published, '%Y-%m-%dT%H:%M:%SZ')
        print(f'Published: {dt.strftime(\"%Y-%m-%d %H:%M UTC\")}')
    
    assets = release.get('assets', [])
    print(f'Assets: {len(assets)}')
    
    print(f'URL: {release[\"html_url\"]}')
    
except Exception as e:
    print('Error parsing latest release:', str(e))
    sys.exit(1)
"
            fi
        fi
    fi
    
    # Check GitHub Actions status for recent workflow runs
    info "Checking recent workflow runs..."
    
    if command -v curl &> /dev/null; then
        local workflows=$(curl -s "$GITHUB_API/actions/runs?per_page=5")
        
        if ! echo "$workflows" | grep -q "\"message\""; then
            echo ""
            log "${BLUE}Recent Workflow Runs:${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━"
            
            echo "$workflows" | python3 -c "
import json, sys, datetime
try:
    data = json.load(sys.stdin)
    runs = data.get('workflow_runs', [])
    
    for run in runs[:5]:
        name = run.get('name', 'Unknown')
        status = run.get('status', 'unknown')
        conclusion = run.get('conclusion', '')
        created = run.get('created_at', '')
        head_branch = run.get('head_branch', 'unknown')
        
        if created:
            dt = datetime.datetime.strptime(created, '%Y-%m-%dT%H:%M:%SZ')
            date_str = dt.strftime('%m-%d %H:%M')
        else:
            date_str = 'unknown'
        
        status_icon = {
            'completed': '✓' if conclusion == 'success' else '✗' if conclusion == 'failure' else '○',
            'in_progress': '⟳',
            'queued': '⋯'
        }.get(status, '?')
        
        print(f'{status_icon} {name} ({head_branch}) - {status} {conclusion} - {date_str}')
        
except Exception as e:
    print('Error parsing workflow runs:', str(e))
"
        fi
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create [VERSION]  Create and push new release tag (uses POM version if not specified)"
    echo "  list [LIMIT]      List recent releases (default: 10)"
    echo "  status [VERSION]  Check release status (latest if no version)"
    echo ""
    echo "Examples:"
    echo "  $0 create                 # Create release using version from pom.xml"
    echo "  $0 create v1.0.0          # Create release v1.0.0 (overrides POM version)"
    echo "  $0 create 1.2.3           # Create release v1.2.3 (adds v prefix)"
    echo "  $0 list 5                 # List 5 most recent releases"
    echo "  $0 status                 # Check latest release status"
    echo "  $0 status v1.0.0          # Check specific release status"
}

# Main command handling
COMMAND=${1:-}

case $COMMAND in
    create)
        shift
        create_release "$@"
        ;;
    list)
        shift
        list_releases "$@"
        ;;
    status)
        shift
        check_status "$@"
        ;;
    help|--help|-h|"")
        show_usage
        ;;
    *)
        error "Unknown command: $COMMAND"
        ;;
esac