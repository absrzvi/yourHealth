# Blood Report Management System

The Blood Report Management System is a comprehensive feature of the yourHealth platform that allows users to upload, parse, view, and analyze blood test reports. It provides insights into biomarker trends over time and helps users track their health metrics.

## Features

### Data Management
- Upload and parse blood test reports from OCR text
- Store comprehensive metadata including report date, lab name, doctor name, etc.
- Manage blood biomarkers with reference ranges and abnormality detection
- Support for report versioning and amendments
- Soft delete functionality to preserve historical data

### API Endpoints
- RESTful API for CRUD operations on blood reports and biomarkers
- Biomarker trend analysis across reports
- Validation and security with user authentication
- Pagination and filtering support

### User Interface
- Dashboard for viewing all blood reports with status filtering
- Detailed report view with biomarkers grouped by category
- Biomarker trend visualization with charts
- Upload form for new reports with metadata fields
- Edit and delete functionalities

## Technical Architecture

### Data Models
- `BloodTestReport`: Main report entity with metadata and relations
- `BloodBiomarker`: Individual biomarker measurements with reference ranges
- `BloodReportSection`: Report sections for organizing related biomarkers

### Services
- `BloodReportService`: Central service for parsing and managing blood reports
- Integration with `StreamingBloodTestParser` for extracting biomarkers from text

### API Routes
- `/api/blood-reports`: List and create reports
- `/api/blood-reports/[id]`: Manage individual reports
- `/api/blood-reports/biomarkers/[id]`: Manage individual biomarkers
- `/api/blood-reports/biomarkers/trends`: Get trend data for specific biomarkers

### Pages
- `/blood-reports`: Main page with list of reports and trends tab
- `/blood-reports/[id]`: Detailed view of a specific report
- `/blood-reports/[id]/trends`: Biomarker trend visualization
- `/blood-reports/upload`: Form for uploading new reports

## Usage

### Uploading a New Report
1. Navigate to the Blood Reports page
2. Click "Upload New Report"
3. Paste OCR text or upload a text file
4. Fill in metadata fields (report date, lab name, etc.)
5. Submit the form

### Viewing Reports
1. Go to the Blood Reports page
2. Browse the list of reports
3. Filter by status if needed
4. Click on a report to view details

### Analyzing Trends
1. Select a report and click "View Trends"
2. Or, go to a report's detail page and click "View Trends"
3. Choose a biomarker from the dropdown
4. View the graph or table representation of historical values

## Integration with AI Coach

The Blood Report Management System integrates with the AI Coach feature to provide:
- Personalized insights based on biomarker values
- Health recommendations informed by blood test results
- Visual representations of health metrics over time
- Alerts for abnormal or concerning values

## Future Enhancements
- Advanced biomarker correlation analysis
- Comparison with population norms and health targets
- Automated report classification by health domain
- PDF report parsing and document image analysis
- Integration with external lab systems for direct import
