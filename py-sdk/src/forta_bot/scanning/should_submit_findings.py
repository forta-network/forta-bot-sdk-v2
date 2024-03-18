import sys
from datetime import datetime
from typing import Callable
from ..findings import Finding
from ..utils import Logger, assert_exists
from .constants import ONE_MIN_IN_SECONDS

ShouldSubmitFindings = Callable[[list[Finding], datetime], bool]


def provide_should_submit_findings(logger: Logger) -> ShouldSubmitFindings:
    assert_exists(logger, 'logger')

    def should_submit_findings(findings: list[Finding], last_submission_timestamp: datetime) -> bool:
        # if no findings, dont submit
        if len(findings) == 0:
            logger.debug('should_submit_findings=False (no findings)')
            return False

        # check if findings byte size is approaching 10MB
        findings_byte_size = sys.getsizeof(findings)
        is_byte_size_approaching_10mb = findings_byte_size > 9500000
        if is_byte_size_approaching_10mb:
            logger.debug(
                f'should_submit_findings=True (approaching 10MB with {findings_byte_size} bytes)')
            return True

        # check if been more than a minute since last submission
        been_more_than_a_minute_since_submission = datetime.now().timestamp(
        ) - last_submission_timestamp.timestamp() > ONE_MIN_IN_SECONDS
        if been_more_than_a_minute_since_submission:
            logger.debug(
                f'should_submit_findings=True (been more than a minute since {last_submission_timestamp})')
            return True

        logger.debug('should_submit_findings=False (no conditions met)')
        return False

    return should_submit_findings
