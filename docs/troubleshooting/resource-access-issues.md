# RabbitMQ Resource Access Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues when accessing RabbitMQ resources through the admin interface. Issues are organized by category with step-by-step resolution procedures.

## Quick Diagnosis Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] User is logged in with valid credentials
- [ ] User has been assigned to at least one cluster
- [ ] Selected cluster is active and accessible
- [ ] Network connectivity to the cluster is working
- [ ] Browser has JavaScript enabled
- [ ] No browser console errors are present
- [ ] RabbitMQ Management UI is accessible (test by navigating directly to cluster URL)

## Authentication and Authorization Issues

### Issue: "Authentication required" Error

**Symptoms:**

- HTTP 401 Unauthorized responses
- Automatic redirect to login page
- "Authentication required" error messages

**Causes:**

- JWT token has expired
- Invalid or missing authentication token
- Session has been terminated

**Resolution Steps:**

1. **Check token expiration:**

   ```javascript
   // Open browser console and check token
   const token = localStorage.getItem("jwt-token");
   if (token) {
     const payload = JSON.parse(atob(token.split(".")[1]));
     console.log("Token expires:", new Date(payload.exp * 1000));
   }
   ```

2. **Enable debug logging for authentication:**

   To troubleshoot JWT authentication issues, enable debug logging in the backend:

   ```yaml
   # Add to application.yml or set as environment variable
   logging:
     level:
       com.rabbitmq.admin.security.JwtAuthenticationFilter: DEBUG
   ```

   This will provide detailed logs including:

   - Request path and HTTP method being processed
   - JWT token presence and validation status
   - User details and authorities after successful authentication
   - Authentication context setup in Spring Security

3. **Clear session and re-authenticate:**

   - Click "Logout" in the application
   - Clear browser cache and cookies for the application domain
   - Log back in with valid credentials

4. **Verify credentials:**
   - Ensure username and password are correct
   - Check if account has been disabled or suspended
   - Contact administrator if credentials are not working

**Prevention:**

- Enable "Remember Me" option during login
- Set up automatic token refresh if available
- Monitor token expiration times
- Use debug logging in development to identify authentication issues early

### Issue: "Access denied to cluster" Error

**Symptoms:**

- HTTP 403 Forbidden responses
- "Access denied to cluster" error messages
- Unable to view resource data despite being logged in

**Causes:**

- User not assigned to the selected cluster
- Cluster permissions have been revoked
- Role-based access control restrictions

**Resolution Steps:**

1. **Verify cluster assignments:**

   - Go to user profile or dashboard
   - Check list of assigned clusters
   - Confirm the cluster you're trying to access is listed

2. **Try different cluster:**

   - Switch to a different cluster from the cluster selector
   - Verify access works with other assigned clusters

3. **Contact administrator:**
   - Request cluster access if needed
   - Verify current role and permissions
   - Check if cluster assignments have changed

**Prevention:**

- Regularly review cluster assignments
- Understand your role and access levels
- Communicate with administrators about access needs

## Cluster Connectivity Issues

### Issue: "RabbitMQ cluster unavailable" Error

**Symptoms:**

- HTTP 500 Internal Server Error responses
- "RabbitMQ cluster unavailable" error messages
- Timeout errors when loading resource data
- Intermittent connection failures

**Causes:**

- RabbitMQ cluster is down or unreachable
- Network connectivity issues
- Firewall blocking connections
- RabbitMQ Management API is disabled

**Resolution Steps:**

1. **Check cluster status:**

   - Verify cluster is running and accessible
   - Check cluster health from RabbitMQ Management UI directly
   - Confirm all cluster nodes are operational

2. **Test network connectivity:**

   ```bash
   # Test basic connectivity to cluster
   ping <cluster-host>

   # Test management API port (usually 15672)
   telnet <cluster-host> 15672

   # Test AMQP port (usually 5672)
   telnet <cluster-host> 5672
   ```

3. **Verify firewall settings:**

   - Ensure management API port (15672) is accessible
   - Check for corporate firewall restrictions
   - Verify VPN connectivity if required

4. **Check RabbitMQ Management Plugin:**

   ```bash
   # On RabbitMQ server, verify management plugin is enabled
   rabbitmq-plugins list | grep management

   # Enable if necessary
   rabbitmq-plugins enable rabbitmq_management
   ```

**Prevention:**

- Monitor cluster health regularly
- Set up cluster monitoring and alerting
- Maintain network connectivity documentation
- Keep firewall rules updated

### Issue: Slow Loading or Timeouts

**Symptoms:**

- Resource pages take a long time to load
- Timeout errors during data fetching
- Partial data loading
- Browser becomes unresponsive

**Causes:**

- Large datasets with insufficient pagination
- Network latency or bandwidth issues
- RabbitMQ cluster performance problems
- Browser resource limitations

**Resolution Steps:**

1. **Optimize pagination:**

   - Reduce page size to 25 or 50 items
   - Use name filtering to narrow results
   - Avoid loading all resources at once

2. **Check network performance:**

   ```bash
   # Test network latency
   ping <cluster-host>

   # Test bandwidth with curl
   curl -w "@curl-format.txt" -o /dev/null -s "http://<cluster-host>:15672/api/overview"
   ```

3. **Monitor cluster performance:**

   - Check RabbitMQ cluster CPU and memory usage
   - Verify cluster is not overloaded
   - Look for performance bottlenecks

4. **Browser optimization:**
   - Close unnecessary browser tabs
   - Clear browser cache
   - Disable browser extensions temporarily
   - Try a different browser

**Prevention:**

- Use appropriate page sizes for your environment
- Implement regular cluster performance monitoring
- Maintain adequate network bandwidth
- Keep browsers updated

## URL Encoding Issues

### Issue: "404 Not Found" for Resources with Special Characters

**Symptoms:**

- HTTP 404 errors when accessing resources in default vhost (`/`)
- Resources work in RabbitMQ Management UI but not in admin interface
- Curl commands work but WebClient requests fail
- Bindings or exchanges with special characters in names fail to load

**Causes:**

- Incorrect URL encoding of vhost names (especially `/` default vhost)
- Double encoding of already-encoded URLs (fixed in RabbitMQClientService)
- WebClient encoding differences compared to curl (resolved with URI template approach)
- Special characters in resource names not properly encoded

**Resolution Steps:**

1. **Verify the fix is working:**

   Run the fix verification test to confirm URL encoding is working correctly:

   ```bash
   # Test the WebClient URL encoding fix
   mvn test -pl backend -Dtest=RabbitMQClientServiceFixTest

   # Test different URL encoding methods (for debugging)
   mvn test -pl backend -Dtest=WebClientEncodingTest#testUrlEncodingIssues

   # Test bindings endpoint specifically
   mvn test -pl backend -Dtest=WebClientEncodingTest#testBindingsWithCorrectEncoding
   ```

2. **Compare with curl behavior:**

   ```bash
   # Test the same endpoint with curl (this should work)
   curl -u admin:admin "http://localhost:15672/api/exchanges/%2F/demo-ex/bindings/source"

   # Compare with WebClient test output
   mvn test -pl backend -Dtest=WebClientLiveTest#testComparisonWithCurl
   ```

3. **Understanding the fix:**

   The `RabbitMQClientService` now automatically handles URL encoding correctly:

   ```java
   // The service automatically detects %2F in paths and uses URI templates
   // This is handled internally by the buildUri() method:

   private java.net.URI buildUri(UriBuilder uriBuilder, String path) {
       if (path.contains("%2F")) {
           // Replace %2F with {vhost} and use URI template to avoid double encoding
           String templatePath = path.replace("%2F", "{vhost}");
           return uriBuilder.path(templatePath).build("/");
       } else {
           return uriBuilder.path(path).build();
       }
   }
   ```

   For custom WebClient usage, use these patterns:

   ```java
   // ✅ Recommended: URI template approach
   client.get()
       .uri("/api/exchanges/{vhost}/demo-ex", "/")
       .retrieve()
       .bodyToMono(String.class);

   // ✅ Alternative: UriBuilder with build(false)
   client.get()
       .uri(uriBuilder -> uriBuilder
           .path("/api/exchanges/%2F/demo-ex")
           .build(false))  // Don't double-encode
       .retrieve()
       .bodyToMono(String.class);
   ```

4. **Verify vhost encoding:**

   - Default vhost `/` should be encoded as `%2F`
   - Named vhosts should use URI templates or proper encoding
   - Avoid manual URL encoding that can cause double-encoding

**Prevention:**

- Use URI templates for dynamic path parameters
- Test with both default (`/`) and named vhosts
- Run encoding tests during development
- Compare WebClient behavior with curl commands

## Data Loading Issues

### Issue: Unexpected Redirects During Page Refresh

**Symptoms:**

- Being redirected to dashboard when refreshing a resource page
- Losing current page context after browser refresh
- Intermittent redirects when navigating directly to resource URLs

**Causes:**

- Application loading state not properly handled during page refresh
- Race condition between cluster data loading and route protection
- Browser cache issues affecting initial load sequence

**Resolution Steps:**

1. **Understanding the fix:**

   The application now properly handles loading states to prevent premature redirects during page refresh. The route guard waits for cluster data to fully load before making redirect decisions.

2. **Use debug logging to diagnose issues:**

   Open the browser console to see ResourceRoute debug logs that show:

   ```
   ResourceRoute render: {
     loading: false,
     clustersLength: 2,
     selectedCluster: "production-cluster",
     error: null
   }
   ```

   If you see `loading: true` for extended periods or `clustersLength: 0` when clusters should be available, this indicates a cluster loading issue.

3. **If still experiencing issues:**

   - Clear browser cache and reload the page
   - Ensure JavaScript is enabled in your browser
   - Check browser console for ResourceRoute debug logs and any loading errors
   - Try logging out and back in to reset session state

4. **Verify proper behavior:**

   - Refresh any resource page - you should stay on the same page
   - Navigate directly to resource URLs - they should load properly after authentication
   - Switch between clusters - navigation should remain stable

**Prevention:**

- Keep browser updated to latest version
- Avoid interrupting page loads during initial startup
- Allow sufficient time for application initialization
- Monitor ResourceRoute debug logs during development

### Issue: Empty or Missing Resource Data

**Symptoms:**

- Resource lists show "No data available"
- Expected resources are not displayed
- Inconsistent data between refreshes
- Some resource types work while others don't

**Causes:**

- No resources exist in the cluster
- Filtering is too restrictive
- Caching issues
- API endpoint problems

**Resolution Steps:**

1. **Verify resources exist:**

   - Check RabbitMQ Management UI directly
   - Confirm resources exist in the cluster
   - Verify you're looking at the correct vhost

2. **Clear filters:**

   - Reset all search and filter settings
   - Clear name search field
   - Remove state and type filters

3. **Clear cache:**

   ```javascript
   // Clear application cache in browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

4. **Check API endpoints:**

   ```bash
   # Test API endpoint directly
   curl -H "Authorization: Bearer <token>" \
     "http://localhost:8080/api/rabbitmq/<cluster-id>/resources/connections"
   ```

5. **Use WebClient debugging tests:**

   For backend connectivity issues, run the enhanced WebClient tests to debug RabbitMQ Management API connectivity. Multiple test suites are available for different scenarios:

   ```bash
   # Run WebClient debugging tests (works without RabbitMQ, graceful error handling)
   mvn test -pl backend -Dtest=WebClientBindingsTest

   # Run URL encoding tests to debug vhost and special character issues
   mvn test -pl backend -Dtest=WebClientEncodingTest

   # Run live tests with immediate feedback (requires RabbitMQ running)
   mvn test -pl backend -Dtest=WebClientLiveTest

   # Run integration tests with real RabbitMQ (automated testing)
   mvn test -pl backend -Dtest=WebClientBindingsIntegrationTest -Drabbitmq.available=true

   # Or run specific test methods for targeted debugging
   mvn test -pl backend -Dtest=WebClientBindingsTest#testWebClientDirectCall
   mvn test -pl backend -Dtest=WebClientEncodingTest#testUrlEncodingIssues
   mvn test -pl backend -Dtest=WebClientLiveTest#testWebClientWithLiveRabbitMQ
   mvn test -pl backend -Dtest=WebClientLiveTest#testComparisonWithCurl
   ```

   These tests help identify:

   - WebClient configuration issues
   - URL encoding problems with vhost names (especially `/` default vhost)
   - Authentication header problems
   - JSON deserialization issues
   - Basic RabbitMQ Management API connectivity

   **URL Encoding Test Requirements:**

   The `WebClientEncodingTest` specifically tests different URL encoding approaches:

   1. Pre-encoded URLs (matching curl behavior)
   2. URI template approach (Spring handles encoding)
   3. UriBuilder with `build(false)` to prevent double encoding
   4. UriBuilder with `build(true)` for default encoding
   5. Raw path variations

   **Live Test Requirements:**

   To run `WebClientLiveTest`, you need:

   1. RabbitMQ running on `localhost:15672` with default credentials (`admin:admin`)
   2. Test exchange and queue setup (optional - tests will show what's available)

   **Integration Test Requirements:**

   To run `WebClientBindingsIntegrationTest`, you need:

   1. RabbitMQ running on `localhost:15672` with default credentials (`admin:admin`)
   2. Test data: Exchange `demo-ex`, Queue `demo-q`, and a binding between them with routing key `demo`
   3. System property `-Drabbitmq.available=true` to enable the test

   - Connection failures are handled gracefully with informative error messages

**Prevention:**

- Understand your cluster's resource topology
- Use filters judiciously
- Regularly refresh data
- Monitor API endpoint health

### Issue: Outdated or Stale Data

**Symptoms:**

- Resource data doesn't reflect recent changes
- Counters and statistics are not updating
- New resources don't appear
- Deleted resources still shown

**Causes:**

- Caching is preventing updates
- Auto-refresh is disabled
- Network issues preventing updates
- Clock synchronization problems

**Resolution Steps:**

1. **Force refresh:**

   - Click the manual refresh button
   - Use Ctrl+F5 or Cmd+Shift+R to hard refresh
   - Clear browser cache

2. **Enable auto-refresh:**

   - Turn on auto-refresh in the interface
   - Set appropriate refresh interval (30s-1m)
   - Monitor refresh status indicators

3. **Check time synchronization:**

   - Verify system clock is accurate
   - Check cluster node time synchronization
   - Ensure timezone settings are correct

4. **Clear application cache:**
   ```javascript
   // Clear resource cache
   if (window.resourceCache) {
     window.resourceCache.clear();
   }
   ```

**Prevention:**

- Use auto-refresh for dynamic environments
- Monitor refresh timestamps
- Keep system clocks synchronized
- Understand cache behavior

## Performance Issues

### Issue: High Memory Usage or Browser Crashes

**Symptoms:**

- Browser becomes slow or unresponsive
- High memory usage in browser task manager
- Browser crashes when loading resources
- System becomes sluggish

**Causes:**

- Loading too many resources at once
- Memory leaks in the application
- Insufficient system resources
- Large resource datasets

**Resolution Steps:**

1. **Reduce data load:**

   - Use smaller page sizes (25-50 items)
   - Apply name filtering to reduce dataset
   - Close detail modals when not needed
   - Disable auto-refresh temporarily

2. **Browser optimization:**

   - Close unnecessary tabs and applications
   - Restart the browser
   - Clear browser cache and cookies
   - Update browser to latest version

3. **System resources:**

   - Check available system memory
   - Close other memory-intensive applications
   - Consider using a more powerful machine

4. **Application debugging:**

   ```javascript
   // Monitor memory usage in browser console
   console.log("Memory usage:", performance.memory);

   // Check for memory leaks
   setInterval(() => {
     console.log("Heap used:", performance.memory.usedJSHeapSize);
   }, 5000);
   ```

**Prevention:**

- Use appropriate page sizes for your system
- Regularly restart browser sessions
- Monitor system resource usage
- Keep browsers updated

### Issue: Slow API Response Times

**Symptoms:**

- Long delays when switching between resource types
- Slow pagination navigation
- Timeouts during data loading
- Inconsistent response times

**Causes:**

- RabbitMQ cluster performance issues
- Network latency or congestion
- Large datasets requiring processing
- Inefficient API queries

**Resolution Steps:**

1. **Monitor cluster performance:**

   - Check RabbitMQ cluster CPU and memory
   - Monitor disk I/O and network usage
   - Look for resource bottlenecks

2. **Optimize queries:**

   - Use name filtering to reduce dataset size
   - Choose appropriate page sizes
   - Avoid unnecessary API calls

3. **Network diagnostics:**

   ```bash
   # Test API response times
   curl -w "Total time: %{time_total}s\n" \
     -H "Authorization: Bearer <token>" \
     "http://localhost:8080/api/rabbitmq/<cluster-id>/resources/connections"

   # Test network latency
   ping <cluster-host>
   traceroute <cluster-host>
   ```

4. **WebClient debugging:**

   Use the enhanced WebClient tests to isolate performance issues:

   ```bash
   # Run WebClient performance tests (graceful error handling)
   mvn test -pl backend -Dtest=WebClientBindingsTest#testWebClientDirectCall

   # Run live performance tests with immediate feedback
   mvn test -pl backend -Dtest=WebClientLiveTest#testWebClientWithLiveRabbitMQ
   ```

   The test output will show:

   - WebClient configuration details
   - Request/response timing information
   - Error details with HTTP status codes
   - Response body content for debugging

5. **Caching optimization:**
   - Enable client-side caching
   - Use appropriate cache TTL values
   - Monitor cache hit rates

**Prevention:**

- Monitor cluster performance regularly
- Maintain adequate network bandwidth
- Use efficient query patterns
- Implement proper caching strategies

## RabbitMQ Management UI Access Issues

### Issue: Cannot Access RabbitMQ Management UI

**Symptoms:**

- Unable to access Management UI directly via cluster URL
- Management UI shows authentication errors
- Management UI loads but shows different data than expected

**Causes:**

- Incorrect cluster API URL configuration
- RabbitMQ Management plugin not enabled
- Network connectivity issues to Management UI
- Authentication credential problems

**Resolution Steps:**

1. **Verify cluster configuration:**

   - Ensure cluster API URL is correct and accessible
   - Test the URL directly in a browser: `http://cluster-host:15672`
   - Verify the URL includes the correct protocol (http/https) and port

2. **Test Management UI directly:**

   ```bash
   # Test Management UI accessibility
   curl -u admin:admin http://cluster-host:15672/api/overview

   # Check if Management plugin is enabled
   curl -u admin:admin http://cluster-host:15672/api/nodes
   ```

3. **Verify cluster credentials:**

   - Ensure the cluster username/password are correct
   - Test credentials in the Management UI directly
   - Check if credentials have sufficient permissions

4. **Check network connectivity:**
   - Verify firewall settings allow access to port 15672
   - Test network connectivity to the cluster host
   - Check VPN or proxy settings if applicable

**Prevention:**

- Regularly test Management UI accessibility
- Keep cluster configurations up to date
- Monitor RabbitMQ Management plugin status
- Document cluster access procedures

### Issue: Management UI Opens But Shows Different Data

**Symptoms:**

- Management UI opens successfully but shows different resources
- Resource counts don't match between interfaces
- Different virtual hosts or permissions visible
- Inconsistent cluster information

**Causes:**

- Different user credentials between interfaces
- Virtual host access differences
- Cluster configuration discrepancies
- Time synchronization issues

**Resolution Steps:**

1. **Compare credentials:**

   - Verify both interfaces use the same cluster configuration
   - Check if Management UI uses different authentication
   - Ensure virtual host access is consistent

2. **Check virtual host selection:**

   - Verify you're viewing the same virtual host in both interfaces
   - Switch virtual hosts in Management UI to match
   - Check virtual host permissions for the user

3. **Refresh both interfaces:**

   - Refresh the integrated resource browser
   - Refresh the Management UI tab
   - Compare timestamps and data freshness

4. **Verify cluster selection:**
   - Ensure you're connected to the same cluster in both interfaces
   - Check cluster node information in Management UI
   - Verify cluster API URL matches the Management UI URL

**Prevention:**

- Use consistent cluster configurations
- Document virtual host access patterns
- Regularly synchronize data between interfaces
- Monitor cluster configuration changes

## Browser and Client Issues

### Issue: JavaScript Errors or Console Warnings

**Symptoms:**

- Error messages in browser console
- Broken functionality or missing features
- Unexpected behavior in the interface
- Warning messages about deprecated features

**Causes:**

- Browser compatibility issues
- JavaScript errors in the application
- Conflicting browser extensions
- Outdated browser version

**Resolution Steps:**

1. **Check browser console:**

   - Open browser developer tools (F12)
   - Look for error messages in the console
   - Note any network request failures

2. **Browser compatibility:**

   - Ensure browser is supported (Chrome 90+, Firefox 88+, Safari 14+)
   - Update browser to latest version
   - Try a different browser

3. **Disable extensions:**

   - Temporarily disable all browser extensions
   - Test functionality with extensions disabled
   - Re-enable extensions one by one to identify conflicts

4. **Clear browser data:**
   - Clear cache, cookies, and local storage
   - Reset browser settings if necessary
   - Try incognito/private browsing mode

**Prevention:**

- Keep browsers updated
- Use supported browsers
- Regularly clear browser cache
- Monitor browser console for warnings

### Issue: Mobile or Tablet Display Problems

**Symptoms:**

- Interface elements are too small or large
- Navigation is difficult on touch devices
- Tables don't display properly
- Buttons are hard to tap

**Causes:**

- Responsive design issues
- Touch interface problems
- Screen size limitations
- Mobile browser differences

**Resolution Steps:**

1. **Check viewport settings:**

   - Ensure proper viewport meta tag
   - Verify responsive design is working
   - Test on different screen orientations

2. **Browser optimization:**

   - Use mobile-optimized browsers
   - Enable desktop mode if necessary
   - Adjust browser zoom settings

3. **Interface adjustments:**

   - Use landscape orientation for tables
   - Zoom in for better visibility
   - Use touch-friendly navigation

4. **Alternative access:**
   - Consider using desktop browser when possible
   - Use tablet in landscape mode
   - Access via desktop for complex operations

**Prevention:**

- Test on multiple device types
- Use responsive design principles
- Optimize for touch interfaces
- Provide mobile-friendly alternatives

## API and Backend Issues

### Issue: HTTP Error Codes

**Symptoms:**

- 400 Bad Request errors
- 404 Not Found errors
- 500 Internal Server Error responses
- Unexpected error messages

**Common HTTP Error Codes:**

#### 400 Bad Request

**Causes:**

- Invalid pagination parameters
- Malformed request data
- Invalid filter parameters

**Resolution:**

- Check pagination parameters (page >= 0, pageSize <= 500)
- Verify filter syntax and values
- Clear all filters and try again

#### 404 Not Found

**Causes:**

- Cluster connection not found
- Invalid cluster ID
- Resource endpoint not available

**Resolution:**

- Verify cluster ID is correct
- Check cluster still exists and is active
- Try selecting cluster again from dashboard

#### 500 Internal Server Error

**Causes:**

- RabbitMQ cluster unavailable
- Backend service issues
- Database connectivity problems

**Resolution:**

- Check cluster connectivity
- Verify backend service status
- Contact administrator for server issues

#### 503 Service Unavailable

**Causes:**

- Backend service is down
- Maintenance mode
- Overloaded servers

**Resolution:**

- Wait and retry after a few minutes
- Check service status page
- Contact administrator

**Prevention:**

- Monitor API endpoint health
- Implement proper error handling
- Use appropriate retry strategies
- Keep backend services updated

## Monitoring and Logging

### Enabling Debug Logging

For troubleshooting, enable debug logging:

1. **Backend Authentication Debug Logging:**

   Enable detailed JWT authentication logging by setting the log level:

   ```yaml
   # In application.yml
   logging:
     level:
       com.rabbitmq.admin.security.JwtAuthenticationFilter: DEBUG
   ```

   Or using environment variables:

   ```bash
   # Set environment variable
   export LOGGING_LEVEL_COM_RABBITMQ_ADMIN_SECURITY_JWTAUTHENTICATIONFILTER=DEBUG
   ```

   This provides detailed logs for:

   - Each request being processed (method and path)
   - JWT token presence and validation results
   - User authentication details and authorities
   - Security context setup and errors

2. **Cluster Management Debug Logging:**

   Enable detailed cluster management logging to track user assignment operations:

   ```yaml
   # In application.yml
   logging:
     level:
       com.rabbitmq.admin.controller.ClusterController: INFO
   ```

   Or using environment variables:

   ```bash
   # Set environment variable
   export LOGGING_LEVEL_COM_RABBITMQ_ADMIN_CONTROLLER_CLUSTERCONTROLLER=INFO
   ```

   This provides logs for:

   - User assignment updates during cluster modifications
   - Number of users assigned to clusters after updates
   - Cluster configuration changes and their impact

3. **Browser Console Logging:**

   ```javascript
   // Enable debug logging
   localStorage.setItem("debug", "true");

   // Set log level
   localStorage.setItem("logLevel", "debug");

   // Reload page to apply settings
   location.reload();
   ```

4. **Frontend Component Debug Logging:**

   The ResourceRoute component now includes built-in debug logging to help troubleshoot loading and cluster selection issues. When you open the browser console, you'll see detailed logs including:

   - Component render state (loading, cluster count, selected cluster)
   - Loading state transitions
   - Cluster context information

   This is particularly useful for diagnosing:

   - Unexpected redirects during page refresh
   - Issues with cluster data loading
   - Problems with route protection logic

   No additional configuration is needed - the debug logs are automatically available in the browser console.

5. **Network Request Monitoring:**

   - Open browser developer tools
   - Go to Network tab
   - Monitor API requests and responses
   - Check for failed requests or slow responses
   - Look for 401/403 responses indicating authentication issues

6. **Application State Monitoring:**
   ```javascript
   // Monitor application state
   console.log("Current user:", JSON.parse(localStorage.getItem("user")));
   console.log("Selected cluster:", localStorage.getItem("selectedCluster"));
   console.log("Cache stats:", window.cacheStats);
   ```

### Performance Monitoring

Monitor application performance:

1. **Response Time Tracking:**

   ```javascript
   // Track API response times
   const startTime = performance.now();
   fetch("/api/rabbitmq/cluster/resources/connections").then(() => {
     const endTime = performance.now();
     console.log("API call took:", endTime - startTime, "ms");
   });
   ```

2. **Memory Usage Monitoring:**
   ```javascript
   // Monitor memory usage
   setInterval(() => {
     if (performance.memory) {
       console.log("Memory usage:", {
         used:
           Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + "MB",
         total:
           Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + "MB",
         limit:
           Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + "MB",
       });
     }
   }, 10000);
   ```

## Getting Additional Help

### Information to Collect

When reporting issues, collect the following information:

1. **Environment Details:**

   - Browser type and version
   - Operating system
   - Network configuration
   - Application version

2. **Error Information:**

   - Exact error messages
   - Browser console logs
   - Network request details
   - Steps to reproduce

3. **System State:**
   - Selected cluster information
   - User role and permissions
   - Current page and filters
   - Recent actions taken

### Escalation Process

1. **Self-Service:**

   - Check this troubleshooting guide
   - Review user documentation
   - Try basic resolution steps

2. **Administrator:**

   - Contact RabbitMQ cluster administrator
   - Verify cluster and user configuration
   - Check server-side logs

3. **Technical Support:**

   - Submit detailed bug report
   - Include all collected information
   - Provide reproduction steps

4. **Emergency Issues:**
   - Contact on-call support for critical issues
   - Escalate through proper channels
   - Document impact and urgency

### Useful Resources

- **RabbitMQ Documentation**: https://www.rabbitmq.com/documentation.html
- **Management Plugin Guide**: https://www.rabbitmq.com/management.html
- **AMQP 0-9-1 Reference**: https://www.rabbitmq.com/amqp-0-9-1-reference.html
- **Browser Developer Tools**: Browser-specific documentation for debugging tools
