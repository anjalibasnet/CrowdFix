const { sendEmail } = require('../utils/email');

async function notifyStatusChange({ report, newStatus }) {
  try {
    if (!report.reporter?.email) return;

    const statusMessages = {
      'ASSIGNED': 'Your report has been assigned to an officer.',
      'IN_PROGRESS': 'Your report is now being worked on.',
      'RESOLVED': 'Your report has been resolved! ' + (report.resolutionNote ? `Details: ${report.resolutionNote}` : ''),
      'CLOSED': 'Your report has been closed.',
    };

    await sendEmail({
      to: report.reporter.email,
      subject: `CrowdFix: Your Report Status Updated - ${newStatus}`,
      text: `Hi ${report.reporter.name},\n\nYour report "${report.title}" has been updated.\n\nNew Status: ${newStatus}\n${statusMessages[newStatus] || ''}\n\nView your reports: https://crowdfix-frontend.vercel.app/my-reports\n\nBest regards,\nCrowdFix Nepal Team`,
    });

    console.log(`✓ Notification sent to ${report.reporter.email}`);
  } catch (error) {
    console.error('Notification error:', error.message);
  }
}

module.exports = { notifyStatusChange };