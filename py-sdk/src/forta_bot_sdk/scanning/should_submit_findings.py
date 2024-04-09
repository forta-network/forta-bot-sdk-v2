import sys
from datetime import datetime
from typing import Callable
from ..findings import Finding
from ..utils import Logger, assert_exists

ShouldSubmitFindings = Callable[[list[Finding], datetime], bool]


def provide_should_submit_findings(logger: Logger) -> ShouldSubmitFindings:
    assert_exists(logger, 'logger')

    def should_submit_findings(findings: list[Finding], last_submission_timestamp: datetime) -> bool:
        num_findings = len(findings)
        # if no findings, dont submit
        if num_findings == 0:
            logger.debug('should_submit_findings=False (no findings)')
            return False

        # if at least 50 findings, submit
        if num_findings >= 50:
            logger.debug(
                f'should_submit_findings=True (more than 50 findings ({num_findings}))')
            return True

        # check if findings byte size is at least 5MB
        findings_byte_size = sys.getsizeof(findings)
        if findings_byte_size >= 5000000:
            logger.debug(
                f'should_submit_findings=True (at least 5MB to send ({findings_byte_size}))')
            return True

        # check if been more than 30 seconds since last submission
        been_more_than_30_seconds_since_submission = datetime.now().timestamp(
        ) - last_submission_timestamp.timestamp() > 30
        if been_more_than_30_seconds_since_submission:
            logger.debug(
                f'should_submit_findings=True (been more than 30s since {last_submission_timestamp})')
            return True

        logger.debug('should_submit_findings=False (no conditions met)')
        return False

    return should_submit_findings
