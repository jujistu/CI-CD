{{/*
Expand the name of the chart.
*/}}
{{- define "ecommerce-api.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "ecommerce-api.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "ecommerce-api.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ include "ecommerce-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "ecommerce-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ecommerce-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
