export enum ReportStatus {
    PENDING = 'pending',     // Recién creado, nadie lo ha visto.
    UNDER_REVIEW = 'review', // Un admin lo está investigando.
    RESOLVED = 'resolved',   // Se tomó una acción (advertencia, baneo, etc.).
    DISMISSED = 'dismissed', // Se determinó que el reporte era falso o inválido.
}