import React from 'react';
import { AssessmentView, AssessmentViewProps } from './AssessmentView';

export const OrdinanceEngine: React.FC<AssessmentViewProps> = (props) => {
  return <AssessmentView {...props} />;
};

export { AssessmentView };
export default AssessmentView;
