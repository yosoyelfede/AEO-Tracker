AEO Analytics Metrics & Visualization Spec

⸻

1  Dataset Schema

Campo	Ejemplo	Notas
query_id	381	Identificador único por prompt
query_text	“mejor sushi de santiago”	Prompt limpio
brand	naoki	Normalizado
model	chatgpt	Enum: chatgpt, gemini, claude, perplexity
timestamp	2025‑07‑17 13:07	Hora de la ejecución
mentioned	true / false	La marca aparece al menos una vez
first_rank	1…∞ / null	Índice de la primera mención (1‑based)
sentiment	‑1.0…+1.0 / null	Solo si mentioned=true
evidence_count	0…∞	Nº de citas, links, datos duros
has_citation	true / false	Fuente externa explícita

Todo lo demás se deriva de esta tabla.

⸻

2  Métricas clave

2.1 Coverage Rate (CR)
	•	Definición  Porcentaje de consultas en las que la marca aparece.
	•	Fórmula
CR_{b,m} = (\sum_q 1_{mentioned}) / \#queries * 100
	•	Granularidad Marca × Modelo; serie temporal.
	•	Visuales KPI card, línea temporal, área stacked para ver share histórico.

2.2 Share of Voice (SoV)
	•	Definición Proporción de menciones de una marca sobre el total.
	•	Fórmula
SoV_{b,m} = \frac{\sum_q mentions_{b,m}}{\sum_q \sum_{b’} mentions_{b’,m}} * 100
	•	Visuales Stacked bar (todas vs todas), doughnut (1 vs todas), small‑multiples por modelo.

2.3 Average Mention Rank (AMR)
	•	Fórmula
\[ AMR_{b,m} = mean(first\rank{b,m,q}) \] (solo donde mentioned=true)
	•	Visuales Box plot por modelo, horizontal bar ordenado.

2.4 Sentiment Score
	•	Fórmula
S_{b,m} = mean(sentiment_{b,m,q})
	•	Visuales Heatmap marca × modelo, dumbbell “antes vs después”.

2.5 Sentiment‑Weighted SoV (SW‑SoV)
	•	Fórmula
SWSoV_{b,m} = SoV_{b,m} * \frac{(S_{b,m}+1)}{2}
	•	Visuales Scatter SoV vs Sentiment con cuadrantes.

2.6 Answer Richness (AR)
	•	Fórmula
\[ AR_{b,m} = mean(evidence\count{b,m,q}) \]
	•	Visuales Radar con métricas cualitativas, violin para distribuciones.

2.7 Citation Presence (CP)
	•	Fórmula
\[ CP_{b,m} = \frac{\sum_q 1_{has\citation}}{\sum_q 1{mentioned}} \]
	•	Visuales Clustered bar; overlay sobre AR.

2.8 Model Win Rate (MWR)
	•	Fórmula
Solo donde ≥2 modelos mencionan la marca.
\[ MWR_{b,m} = \frac{\sum_q 1_{first\rank{b,m,q}=min\m’}}{\sum_q 1{mentioned(b,q)}} \]
	•	Visuales Scatter MWR vs SW‑SoV, waffle chart.

2.9 Competitive Win Rate (CWR)
	•	Fórmula
CWR_{A>B} = \frac{\sum_q 1_{(A gana o B ausente)}}{\sum_q 1_{A\cup B}}
	•	Visuales Matrix heatmap, chord diagram (≤10 marcas).

2.10 Query Effectiveness (QE)
	•	Fórmula
QE_q = \frac{\sum_b SWSoV_{b,q}}{len(query\_text_q)}
	•	Visuales Tabla sortable, pareto chart.

2.11 Volatility Index (VI)
	•	Fórmula
VI_{b,m} = σ(CR^{t-w\dots t}_{b,m}) (ventana móvil w días)
	•	Visuales Línea CR con bandas ±1σ, bullet chart objetivo.

⸻

3  Dashboard Layout sugerido

Tab	Visual principal	Secundarias	Filtros
Overview	KPI cards (CR, SW‑SoV, Sentiment, Top MWR Model)	Mini‑trendlines	Fecha, Marca
Visibilidad	Stacked bar SoV × Modelo	Multi‑line CR	Modelo, Cluster
Calidad	Heatmap Sentiment	Radar AR	Marca
Modelo	Scatter MWR vs SW‑SoV	Box AMR	Marca
Competencia	Heatmap CWR	Chord	Marca foco
Queries	Tabla QE	Pareto QE	Modelo, Marca
Tendencias	Multi‑line CR	Area SoV	Ventana móvil


⸻

4  Comparaciones

Escenario	Gráfico	Justificación
1 marca vs 1 marca	Dumbbell Sentiment/AMR, bullet CWR	Enfatiza diferencias puntuales
1 marca vs todas	Doughnut SoV, línea CR vs promedio	Contexto global
Todas vs todas	Heatmap CWR, matrix Sentiment	Relación cruzada compleja


⸻

5  Tips de visualización
	•	Color fijo para la marca propia; neutros para el resto.
	•	Tooltips ricos: snippet, evidencia, link.
	•	Botones CSV/PNG + REST API para embed.
	•	Alertas server‑side: p.ej. CR ↓ >10 p.p. en 24 h.

⸻

Con este documento dispones de definiciones precisas y un blueprint visual listo para implementar un dashboard de Answer Engine Optimization de nivel profesional.