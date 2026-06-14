import { Typography } from '@mui/material';

interface CoverLetterDisplayProps {
  text?: string;
}

export default function CoverLetterDisplay({ text }: CoverLetterDisplayProps) {
  if (!text?.trim()) return null;

  return (
    <Typography
      variant="h6"
      color="text.secondary"
      sx={{ fontWeight: 400, lineHeight: 1.7, fontStyle: 'italic' }}
    >
      {text}
    </Typography>
  );
}
