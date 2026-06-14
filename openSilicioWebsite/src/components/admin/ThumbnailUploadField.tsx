import { Box, Button, Typography } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';

interface ThumbnailUploadFieldProps {
  label?: string;
  helperText?: string;
  imageUrl?: string;
  uploading?: boolean;
  uploadProgress?: number;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export default function ThumbnailUploadField({
  label = 'Imagem de capa',
  helperText = 'Formatos aceitos: JPEG, PNG, WebP. Máximo 5MB. Será redimensionada e comprimida automaticamente.',
  imageUrl,
  uploading = false,
  uploadProgress = 0,
  onUpload,
  onRemove,
}: ThumbnailUploadFieldProps) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {label}
      </Typography>

      {imageUrl && (
        <Box sx={{ mb: 2 }}>
          <Box
            component="img"
            src={imageUrl}
            alt="Miniatura"
            sx={{
              width: '100%',
              maxHeight: 300,
              objectFit: 'cover',
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'divider',
            }}
          />
        </Box>
      )}

      <Button
        variant="outlined"
        component="label"
        fullWidth
        startIcon={<UploadIcon />}
        disabled={uploading}
      >
        {uploading
          ? `Enviando... ${uploadProgress}%`
          : imageUrl
            ? 'Trocar imagem'
            : 'Enviar imagem'}
        <input
          type="file"
          hidden
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </Button>

      {uploading && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Box
            sx={{
              width: `${uploadProgress}%`,
              height: 4,
              bgcolor: 'primary.main',
              borderRadius: 2,
              transition: 'width 0.3s',
            }}
          />
        </Box>
      )}

      {imageUrl && (
        <Button size="small" color="error" onClick={onRemove} sx={{ mt: 1 }}>
          Remover imagem
        </Button>
      )}

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        {helperText}
      </Typography>
    </Box>
  );
}
