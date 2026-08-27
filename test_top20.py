import sys, pandas as pd; sys.path.insert(0, 'd:/hacka_movistar/backend');
from Motor.motor_oficial import recomendar_top3, DEFAULT_MODEL_PATH
clientes = pd.read_csv('d:/hacka_movistar/data/raw/dataset_clientes.csv')
ofertas = pd.read_csv('d:/hacka_movistar/data/raw/catalogo_ofertas_entrega.csv')

for i in range(1, 21):
    cli_id = f'CLI{i:06d}'
    cliente = clientes[clientes['cliente_id'] == cli_id].to_dict(orient='records')[0]
    res = recomendar_top3(cliente, ofertas, ruta_modelo=DEFAULT_MODEL_PATH)
    if not res.get('top_3'): continue
    top = res['top_3'][0]
    elegible = cliente.get('elegible_mt')
    print(f'{cli_id} (MT:{elegible}): Top 1 -> {top["oferta_id"]} - Score: {top["score_ranking"]}')
