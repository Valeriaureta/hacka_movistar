import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Sparkles, CheckCheck, Phone, Video, MoreVertical, 
  Zap, CheckCircle2, XCircle, MessageSquare, Clock, ArrowRight, 
  ShieldCheck, Headphones, Info, Layers, Flame, SendHorizontal, 
  Edit3, Search, ChevronRight, HelpCircle, FileText, Wifi, Smartphone, 
  Package, RefreshCw, Star, Tag, AlertCircle, ShoppingBag, PlusCircle,
  CornerDownRight
} from 'lucide-react';
import { MOCK_CLIENTES } from '../data/mockData';
import { api } from '../services/api';
import RebateModal from './RebateModal';
import { useTheme } from '../context/ThemeContext';

// Menú principal oficial del Bot de WhatsApp Movistar Perú (Luz)
const BOT_MENU_OPTIONS = [
  { id: 'RECIBOS', icon: FileText, label: '1. Consultar recibos y pagos', desc: 'Ver estado de cuenta, deuda y link de pago' },
  { id: 'PLANES', icon: Sparkles, label: '2. Descubrir planes y NBO', desc: 'Ofertas exclusivas y paquetes Movistar Total', highlight: true },
  { id: 'INTERNET', icon: Wifi, label: '3. Problemas con internet hogar', desc: 'Diagnóstico de fibra óptica y reportes' },
  { id: 'MOVIL', icon: Smartphone, label: '4. Problemas con mi línea móvil', desc: 'Soporte de señal, gigas y configuración' },
  { id: 'EQUIPOS', icon: ShoppingBag, label: '5. Explorar equipos y chips', desc: 'Renovación de smartphone y eSIM' },
  { id: 'PORTABILIDAD', icon: RefreshCw, label: '6. Cambiarme a Movistar', desc: 'Portabilidad y nuevas líneas' },
  { id: 'EXTRAS', icon: PlusCircle, label: '7. Servicios adicionales', desc: 'Movistar TV App, Disney+, Max y beneficios' },
];

export function CanalWhatsApp() {
  const [clientesList, setClientesList] = useState(MOCK_CLIENTES);
  const [selectedCliente, setSelectedCliente] = useState(MOCK_CLIENTES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [handoverActive, setHandoverActive] = useState(false);
  const [isRebateOpen, setIsRebateOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [activeTabPanel, setActiveTabPanel] = useState('ia_context'); // 'ia_context' | 'quick_replies'
  const { isDark } = useTheme();
  
  const chatContainerRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    api.getClientes('WhatsApp', 15)
      .then(data => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setClientesList(data);
          setSelectedCliente(data[0]);
          initBotConversation(data[0]);
        }
      })
      .catch(err => {
        console.error("Error al cargar clientes WhatsApp:", err);
        setSelectedCliente(MOCK_CLIENTES[0]);
        initBotConversation(MOCK_CLIENTES[0]);
      });

    return () => { isMounted = false; };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const [activeOffer, setActiveOffer] = useState(null);

  // Helper para resolver la oferta óptima según el contexto del flujo
  const resolveContextualNBO = (cli, contextType) => {
    const rawCli = cli?.cliente || cli;
    const ofertas = cli?.motor_nbo?.top_3 || cli?.ofertas_nbo || [];
    const fallbackMT = {
      oferta_id: "MT-DUO-PRO-200",
      nombre_oferta: "Movistar Total Dúo Pro 200 Mbps",
      tipo_oferta: "Movistar Total",
      precio_regular: 169.90,
      precio_promocional: 119.90,
      precio_mensual: 119.90,
      ahorro_pct: 35,
      prob_aceptacion: 0.85,
      es_movistar_total: true
    };

    if (contextType === 'FIBRA' || contextType === 'INTERNET') {
      // 1. Buscar en las ofertas NBO del cliente una que sea convergente (MT) o de fibra/hogar
      const fibraMatch = ofertas.find(o => 
        o.es_movistar_total || 
        o.tipo_oferta?.toLowerCase().includes('total') || 
        o.tipo_oferta?.toLowerCase().includes('hogar') ||
        o.tipo_oferta?.toLowerCase().includes('retención') ||
        o.tipo_oferta?.toLowerCase().includes('blindaje') ||
        o.nombre_oferta?.toLowerCase().includes('fibra') || 
        o.nombre_oferta?.toLowerCase().includes('mbps')
      );
      if (fibraMatch) {
        return { oferta: fibraMatch, category: 'FIBRA', isExactMatch: true };
      }

      // Si el cliente no tiene en su ML una de fibra, usar la convergente Movistar Total recomendada
      if (cli?.elegible_mt || !cli?.es_movistar_total) {
        return { oferta: fallbackMT, category: 'FIBRA', isExactMatch: true };
      }

      // Pivote inteligente si ya tiene el máximo de fibra
      return { oferta: ofertas[0] || fallbackMT, category: 'PIVOT_FIBRA', isExactMatch: false };
    }

    if (contextType === 'MOVIL' || contextType === 'EQUIPOS') {
      const movilMatch = ofertas.find(o => 
        !o.es_movistar_total || 
        o.tipo_oferta?.toLowerCase().includes('móvil') || 
        o.tipo_oferta?.toLowerCase().includes('upgrade') ||
        o.nombre_oferta?.toLowerCase().includes('ilimitado') ||
        o.nombre_oferta?.toLowerCase().includes('plan')
      );
      if (movilMatch) {
        return { oferta: movilMatch, category: contextType, isExactMatch: true };
      }
      return { oferta: ofertas[0] || fallbackMT, category: contextType, isExactMatch: false };
    }

    // Por defecto (GENERAL / PLANES)
    return { oferta: ofertas[0] || fallbackMT, category: 'GENERAL', isExactMatch: true };
  };

  // Iniciar conversación del Bot Luz
  const initBotConversation = (cli) => {
    setHandoverActive(false);
    const rawCli = cli?.cliente || cli;
    const initialOffer = cli?.motor_nbo?.top_3?.[0] || cli?.ofertas_nbo?.[0] || {
      oferta_id: "MT-DUO-PRO-200",
      nombre_oferta: "Movistar Total Dúo Pro 200 Mbps",
      precio_promocional: 119.90,
      precio_mensual: 119.90,
      precio_regular: 169.90,
      ahorro_pct: 35,
      es_movistar_total: true
    };
    setActiveOffer(initialOffer);

    const firstName = cli?.nombre ? cli.nombre.split(' ')[0] : 'Cliente';
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages([
      {
        id: 1,
        sender: 'cliente',
        text: `Hola, soy ${firstName} (DNI: ${cli?.dni || cli?.cliente_id}). Me gustaría hacer una consulta sobre mi cuenta.`,
        time: currentTime
      },
      {
        id: 2,
        sender: 'bot',
        text: `¡Hola ${firstName}! 🌟 Te damos la bienvenida a *Movistar Perú*.\nSoy *Luz*, tu asistente virtual inteligente 24/7. Estoy aquí para ayudarte de forma inmediata.`,
        time: currentTime
      },
      {
        id: 3,
        sender: 'bot',
        text: `📌 *¿En qué te puedo ayudar hoy?*\nSelecciona una de las siguientes opciones o escríbeme directamente:`,
        isMenu: true,
        time: currentTime
      }
    ]);
    scrollToBottom();
  };

  // Búsqueda de cliente por cliente_id o DNI
  const handleSearchCliente = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const found = await api.getClienteByDniOrId(searchQuery.trim(), 'WhatsApp');
      if (found) {
        setSelectedCliente(found);
        initBotConversation(found);
        setFeedbackMsg({ type: 'success', text: `Cliente ${found.cliente_id} (${found.nombre}) cargado.` });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setFeedbackMsg({ type: 'reject', text: `No se encontró cliente con "${searchQuery}".` });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectCliente = (cli) => {
    setSelectedCliente(cli);
    initBotConversation(cli);
  };

  // Manejador del menú de opciones de Luz
  const handleMenuClick = (menuId, menuLabel) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const firstName = selectedCliente?.nombre ? selectedCliente.nombre.split(' ')[0] : 'Cliente';

    // 1. Añadir mensaje del cliente con la opción elegida
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'cliente', text: menuLabel, time }
    ]);

    setIsTyping(true);
    scrollToBottom();

    // 2. Respuesta contextualizada de Luz
    setTimeout(() => {
      setIsTyping(false);
      const respTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (menuId === 'PLANES') {
        const { oferta: targetOffer } = resolveContextualNBO(selectedCliente, 'GENERAL');
        setActiveOffer(targetOffer);

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            isOfferCard: true,
            oferta: targetOffer,
            text: `🎯 *¡OFERTA PREDICTIVA PRE-APROBADA PARA TI!*\n\n` +
                  `Analizamos tu perfil y consumo en tu plan actual *${selectedCliente?.plan_actual_nombre}*.\n\n` +
                  `🎁 Te habilitamos el paquete *${targetOffer.nombre_oferta}* por solo *S/ ${targetOffer.precio_promocional}/mes* ` +
                  (targetOffer.ahorro_pct > 0 ? `(ahorras *${targetOffer.ahorro_pct}%* todos los meses)` : `(tarifa preferencial)`) + `.\n\n` +
                  `🚀 *Incluye:* Fibra óptica simétrica, Gigas Ilimitados 5G, Movistar TV y router Smart WiFi gratis sin costo de instalación.`,
            interactiveButtons: [
              { id: 'accept_nbo', label: '✅ Aceptar y Activar en 1 Clic', action: 'ACCEPT' },
              { id: 'more_info_nbo', label: 'ℹ️ Ver más detalles y condiciones', action: 'MORE_INFO' },
              { id: 'rebate_call', label: '💬 Tengo una duda sobre el precio', action: 'REBATE_QUERY' },
              { id: 'human_handover', label: '👤 Hablar con un asesor humano', action: 'HANDOVER' }
            ],
            time: respTime
          }
        ]);
      } else if (menuId === 'RECIBOS') {
        const montoActual = selectedCliente?.plan_actual_precio || 89.90;
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `📄 *Estado de Cuenta de ${firstName}:*\n\n` +
                  `• *Servicio:* ${selectedCliente?.plan_actual_nombre || 'Plan Móvil'}\n` +
                  `• *Último Recibo:* S/ ${montoActual.toFixed(2)} (Al día)\n` +
                  `• *Fecha de vencimiento:* 28 del presente mes\n` +
                  `• *Código de Pago:* 9${selectedCliente?.dni?.substring(0, 8) || '998471625'}\n\n` +
                  `💳 Puedes pagar sin comisiones en la *App Mi Movistar*, banca por internet o agentes autorizados.`,
            interactiveButtons: [
              { id: 'upgrade_after_bill', label: '🎁 ¿Hay promociones o mejoras para mi plan?', action: 'TRIGGER_NBO_DIRECT' },
              { id: 'back_menu', label: '🔙 Volver al Menú Principal', action: 'MAIN_MENU' },
              { id: 'human_transfer', label: '👤 Consultar con un Asesor', action: 'HANDOVER' }
            ],
            time: respTime
          }
        ]);
      } else if (menuId === 'INTERNET') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `🌐 *Diagnóstico de Conectividad Hogar Movistar*\n\n` +
                  `Realicé un testeo automático a tu zona y centralita:\n` +
                  `✅ *Estado de red:* Normal y sin cortes masivos reportados.\n` +
                  `💡 *Recomendación rápida:* Reiniciar el Router Smart WiFi desconectándolo 30 segundos.\n\n` +
                  `Si deseas mayor estabilidad y velocidad simétrica para home office y streaming, cuento con una solución de *Fibra Óptica / Movistar Total* pre-aprobada para tu dirección.`,
            interactiveButtons: [
              { id: 'upgrade_fiber', label: '🚀 Migrar a Fibra Óptica Movistar Total', action: 'TRIGGER_NBO_FIBRA' },
              { id: 'tech_support', label: '🔧 Solicitar visita técnica / Asesor', action: 'HANDOVER' },
              { id: 'back_menu', label: '🔙 Menú Principal', action: 'MAIN_MENU' }
            ],
            time: respTime
          }
        ]);
      } else if (menuId === 'MOVIL') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `📱 *Soporte de Línea Móvil Movistar*\n\n` +
                  `• *Línea consultada:* Asociada a DNI ${selectedCliente?.dni || selectedCliente?.cliente_id}\n` +
                  `• *Estado de señal:* 4.5G / 5G habilitado y activo\n` +
                  `• *Bono de Gigas:* Activo en tu ciclo mensual\n\n` +
                  `¿Deseas mejorar tu paquete de gigas con un plan 5G ilimitado a precio promocional?`,
            interactiveButtons: [
              { id: 'convergent_promo', label: '✨ Ver oferta para mi línea móvil', action: 'TRIGGER_NBO_MOVIL' },
              { id: 'human_transfer', label: '👤 Hablar con soporte móvil', action: 'HANDOVER' },
              { id: 'back_menu', label: '🔙 Menú Principal', action: 'MAIN_MENU' }
            ],
            time: respTime
          }
        ]);
      } else if (menuId === 'EQUIPOS') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `🛍️ *Catálogo de Equipos y Renovación*\n\n` +
                  `¡Tienes un bono de descuento de hasta *S/ 300* por renovación en smartphones 5G (Samsung, Xiaomi, Apple) al renovar tu plan!\n\n` +
                  `¿Quieres ver la oferta que incluye descuento en smartphone y plan con gigas extra?`,
            interactiveButtons: [
              { id: 'view_nbo_with_phone', label: '🎁 Ver plan con descuento en equipo', action: 'TRIGGER_NBO_EQUIPO' },
              { id: 'human_advisor', label: '👤 Asesor de Tienda Virtual', action: 'HANDOVER' },
              { id: 'back_menu', label: '🔙 Menú Principal', action: 'MAIN_MENU' }
            ],
            time: respTime
          }
        ]);
      } else {
        // Portabilidad / Extras
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `🎉 *Servicios y Beneficios Exclusivos Movistar*\n\n` +
                  `Con tu cuenta activa tienes acceso a:\n` +
                  `• *Movistar TV App:* Canales en vivo y partidos de la Liga 1.\n` +
                  `• *Plataformas de streaming:* Disney+ y Max con descuento en tu recibo.\n` +
                  `• *Club Movistar:* Promociones en cines, restaurantes y conciertos.`,
            interactiveButtons: [
              { id: 'nbo_offer_view', label: '🌟 Ver Oferta Especial Movistar Total', action: 'TRIGGER_NBO_DIRECT' },
              { id: 'human_transfer', label: '👤 Contactar Asesor Comercial', action: 'HANDOVER' },
              { id: 'back_menu', label: '🔙 Menú Principal', action: 'MAIN_MENU' }
            ],
            time: respTime
          }
        ]);
      }

      scrollToBottom();
    }, 700);
  };

  // Manejo de botones de acción interactiva
  const handleInteractiveClick = async (action, btnLabel) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Añadir clic del cliente como mensaje
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'cliente', text: btnLabel, time }
    ]);

    setIsTyping(true);
    scrollToBottom();

    setTimeout(async () => {
      setIsTyping(false);
      const respTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (action === 'ACCEPT') {
        const rawCli = selectedCliente?.cliente || selectedCliente;
        const targetOffer = activeOffer || selectedCliente?.motor_nbo?.top_3?.[0] || selectedCliente?.ofertas_nbo?.[0];
        const precio = targetOffer.precio_mensual || targetOffer.precio_promocional;
        // Venta Autónoma 100% Registrada
        await api.registrarGestion({
          cliente_id: rawCli.cliente_id,
          canal: 'WhatsApp',
          oferta_id: targetOffer.oferta_id,
          oferta_nombre: targetOffer.nombre_oferta,
          es_movistar_total: targetOffer.es_movistar_total || targetOffer.oferta_id?.startsWith("OF020") || targetOffer.oferta_id?.startsWith("MT"),
          estado: 'ACEPTADA',
          precio_oferta: precio,
          ahorro_pct: targetOffer.ahorro_pct
        });

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `🎉 *¡Felicidades! Tu solicitud ha sido procesada con éxito.*\n\n` +
                  `Tu nuevo plan *${targetOffer.nombre_oferta}* a tarifa preferencial de *S/ ${targetOffer.precio_promocional}/mes* ha quedado confirmado con el código de orden *#MOV-${Math.floor(100000 + Math.random() * 900000)}*.\n\n` +
                  `✅ Te enviamos la constancia oficial a tu correo electrónico y en la App Mi Movistar.\n` +
                  `¡Gracias por ser parte de la familia Movistar! 💙✨`,
            time: respTime
          }
        ]);
        setFeedbackMsg({ type: 'success', text: `¡Venta Autónoma por WhatsApp completada para ${selectedCliente.cliente_id}!` });
        setTimeout(() => setFeedbackMsg(null), 5000);
      } 
      else if (action === 'MORE_INFO') {
        const targetOffer = activeOffer || selectedCliente?.motor_nbo?.top_3?.[0] || selectedCliente?.ofertas_nbo?.[0];
        const precio = targetOffer.precio_mensual || targetOffer.precio_promocional;
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            isOfferCard: true,
            oferta: targetOffer,
            text: `📋 *Condiciones detalladas de tu oferta:*\n\n` +
                  `• *Plan:* ${targetOffer.nombre_oferta}\n` +
                  `• *Precio regular:* S/ ${targetOffer.precio_regular}\n` +
                  `• *Tu precio preferencial:* S/ ${targetOffer.precio_promocional}/mes\n` +
                  (targetOffer.ahorro_pct > 0 ? `• *Ahorro acumulado:* S/ ${(targetOffer.precio_regular - targetOffer.precio_promocional).toFixed(2)}/mes (${targetOffer.ahorro_pct}% descuento)\n` : '') +
                  `• *Permanencia:* Cero contratos forzosos ni penalidades.\n` +
                  `• *Instalación:* 100% gratuita por canal WhatsApp.\n\n` +
                  `¿Deseas confirmar la activación ahora?`,
            interactiveButtons: [
              { id: 'accept_confirm', label: '✅ ¡Excelente! Activar Ahora', action: 'ACCEPT' },
              { id: 'human_transfer', label: '👤 Hablar con un asesor humano', action: 'HANDOVER' },
              { id: 'main_menu', label: '🔙 Volver al Menú Principal', action: 'MAIN_MENU' }
            ],
            time: respTime
          }
        ]);
      } 
      else if (action === 'REBATE_QUERY') {
        const targetOffer = activeOffer || selectedCliente?.motor_nbo?.top_3?.[0] || selectedCliente?.ofertas_nbo?.[0];
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `💡 *Entiendo tu consulta sobre el costo.*\n\n` +
                  `Al unificar tus servicios en *${targetOffer.nombre_oferta}*, no solo obtienes mayor velocidad y gigas, sino que evitas pagar recibos separados. Tu ahorro anual estimado supera los *S/ ${((targetOffer.precio_regular - targetOffer.precio_promocional) * 12).toFixed(0)}*.\n\n` +
                  `Además, cuentas con el primer mes con un descuento extra de bienvenida.`,
            interactiveButtons: [
              { id: 'accept_after_rebate', label: '✅ Me convence, activar oferta', action: 'ACCEPT' },
              { id: 'human_advisor', label: '👤 Quiero negociar con un asesor humano', action: 'HANDOVER' }
            ],
            time: respTime
          }
        ]);
      }
      else if (action === 'TRIGGER_NBO_DIRECT' || action === 'TRIGGER_NBO_FIBRA' || action === 'TRIGGER_NBO_MOVIL' || action === 'TRIGGER_NBO_EQUIPO') {
        const contextType = action === 'TRIGGER_NBO_FIBRA' ? 'FIBRA' 
                          : action === 'TRIGGER_NBO_MOVIL' ? 'MOVIL' 
                          : action === 'TRIGGER_NBO_EQUIPO' ? 'EQUIPOS' 
                          : 'GENERAL';

        const { oferta: targetOffer, category } = resolveContextualNBO(selectedCliente, contextType);
        setActiveOffer(targetOffer);
        
        let introText = `🎯 *¡OFERTA PREDICTIVA PRE-APROBADA PARA TI!*\n\nAnalizamos tu perfil y consumo en tu plan actual *${selectedCliente?.plan_actual_nombre}*.\n\n`;
        let beneText = `🚀 *Incluye:* Fibra óptica simétrica, Gigas Ilimitados 5G, Movistar TV y router Smart WiFi gratis sin costo de instalación.`;
        
        if (category === 'FIBRA') {
          introText = `🎯 *¡SOLUCIÓN DE FIBRA ÓPTICA Y HOGAR PARA TI!*\n\nPara optimizar tu conexión WiFi y evitar interrupciones, te habilitamos una migración directa a *${targetOffer.nombre_oferta}*:\n\n`;
          beneText = `🚀 *Beneficios:* Velocidad 100% simétrica de alta estabilidad, router Smart WiFi de última generación y soporte técnico prioritario sin costo de instalación.`;
        } else if (category === 'PIVOT_FIBRA') {
          introText = `🌐 *Estado de tu Servicio de Internet Hogar:*\n\nTu línea cuenta actualmente con la velocidad óptima asignada a tu plan. Para complementar tu conectividad total en cualquier lugar, te habilitamos una mejora exclusiva:\n\n`;
          beneText = `🚀 *Beneficios:* Gigas Ilimitados en alta velocidad 5G y opción de compartir internet con tu hogar desde tu smartphone.`;
        } else if (category === 'EQUIPOS') {
          introText = `🎯 *¡RENOVACIÓN DE SMARTPHONE CON TARIFA ESPECIAL!*\n\nAdemás de tu bono de descuento para equipos 5G, te hemos habilitado este plan preferencial:\n\n`;
          beneText = `🚀 *Beneficios:* Más gigas 5G para estrenar tu nuevo smartphone, aplicaciones ilimitadas y Movistar TV App.`;
        } else if (category === 'MOVIL') {
          introText = `🎯 *¡MEJORA EXCLUSIVA PARA TU LÍNEA MÓVIL!*\n\nAnalizamos tu consumo mensual de datos y tienes pre-aprobada una mejora inmediata:\n\n`;
          beneText = `🚀 *Beneficios:* Gigas Ilimitados en red 4.5G/5G, minutos libres a todo destino y tarifa preferencial garantizada.`;
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            isOfferCard: true,
            oferta: targetOffer,
            text: introText +
                  `🎁 Te habilitamos el paquete *${targetOffer.nombre_oferta}* por solo *S/ ${targetOffer.precio_promocional}/mes* ` +
                  (targetOffer.ahorro_pct > 0 ? `(ahorras *${targetOffer.ahorro_pct}%* todos los meses)` : `(tarifa preferencial)`) + `.\n\n` +
                  beneText,
            interactiveButtons: [
              { id: 'accept_nbo', label: '✅ Aceptar y Activar en 1 Clic', action: 'ACCEPT' },
              { id: 'more_info_nbo', label: 'ℹ️ Ver más detalles y condiciones', action: 'MORE_INFO' },
              { id: 'rebate_call', label: '💬 Tengo una duda sobre el precio', action: 'REBATE_QUERY' },
              { id: 'human_handover', label: '👤 Hablar con un asesor humano', action: 'HANDOVER' }
            ],
            time: respTime
          }
        ]);
      }
      else if (action === 'MAIN_MENU') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `📌 *Menú Principal de Luz | Movistar*\n¿Qué otra consulta deseas realizar?`,
            isMenu: true,
            time: respTime
          }
        ]);
      }
      else if (action === 'HANDOVER') {
        setHandoverActive(true);
        setActiveTabPanel('quick_replies');
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'system',
            text: '🔄 HANDOVER ACTIVADO: Transferido a la consola de Asesor Humano. Contexto NBO e historial cargados.',
            time: respTime
          },
          {
            id: Date.now() + 2,
            sender: 'bot',
            text: `Comprendo perfectamente. Te estoy transfiriendo en este momento con un asesor especializado en línea para resolver tus consultas puntuales. 👨‍💼💬`,
            time: respTime
          }
        ]);
      }

      scrollToBottom();
    }, 750);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = inputText.trim();

    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: handoverActive ? 'asesor' : 'cliente', text: userMsg, time }
    ]);
    setInputText('');
    scrollToBottom();

    // Si no está en handover y el usuario escribe texto libre, el bot Luz responde
    if (!handoverActive) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const respTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const lower = userMsg.toLowerCase();
        if (lower.includes('plan') || lower.includes('oferta') || lower.includes('promocion') || lower.includes('nbo') || lower.includes('precio') || lower.includes('mejorar')) {
          handleInteractiveClick('TRIGGER_NBO_DIRECT', userMsg);
        } else if (lower.includes('asesor') || lower.includes('humano') || lower.includes('persona') || lower.includes('reclamo')) {
          handleInteractiveClick('HANDOVER', userMsg);
        } else if (lower.includes('recibo') || lower.includes('deuda') || lower.includes('saldo') || lower.includes('pagar')) {
          handleMenuClick('RECIBOS', userMsg);
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text: `He recibido tu mensaje: "${userMsg}".\nPara brindarte la mejor respuesta, por favor selecciona una de las opciones de mi menú inteligente o solicita atención con un asesor.`,
              isMenu: true,
              time: respTime
            }
          ]);
          scrollToBottom();
        }
      }, 800);
    }
  };

  // Enviar mensaje sugerido del asesor directamente al chat
  const handleSendDirectSuggested = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'asesor', text, time }
    ]);
    scrollToBottom();
  };

  const rawCli = selectedCliente?.cliente || selectedCliente;
  const currentDisplayOffer = activeOffer || selectedCliente?.motor_nbo?.top_3?.[0] || selectedCliente?.ofertas_nbo?.[0] || {
    oferta_id: "MT-DUO-PRO-200",
    nombre_oferta: "Movistar Total Dúo Pro 200 Mbps",
    precio_regular: 169.90,
    precio_promocional: 119.90,
    precio_mensual: 119.90,
    ahorro_pct: 35,
    prob_aceptacion: 0.85,
    es_movistar_total: true
  };
  const firstName = rawCli?.nombre ? rawCli.nombre.split(' ')[0] : 'Cliente';

  // Respuestas sugeridas contextuales para el Asesor Humano en Handover
  const handoverSuggestedMessages = [
    {
      titulo: "👋 Saludo Personalizado del Asesor",
      texto: `¡Hola ${firstName}! Soy tu asesor Movistar asignado. Tengo en pantalla tu expediente y veo tu interés en ${currentDisplayOffer?.nombre_oferta} a S/ ${currentDisplayOffer?.precio_promocional}/mes. ¿Qué detalle puntual te gustaría que resolvamos juntos?`
    },
    {
      titulo: "💰 Explicación de Ahorro y Beneficios",
      texto: `Te confirmo que con ${currentDisplayOffer?.nombre_oferta} mantendrás una tarifa fija promocional de S/ ${currentDisplayOffer?.precio_promocional}/mes (ahorras ${currentDisplayOffer?.ahorro_pct}% unificando tus servicios) sin penalidades ni contratos forzosos.`
    },
    {
      titulo: "🚀 Confirmación de Instalación Gratuita",
      texto: `La migración tecnológica a Fibra Óptica simétrica y la entrega de equipos es 100% bonificada por ser cliente prioritario. ¿Procedemos a registrar la confirmación en el sistema?`
    },
    {
      titulo: "🎁 Bono Extra de Gigas Ilimitados",
      texto: `Para asegurar tu satisfacción, puedo habilitarte de forma inmediata un bono exclusivo de Gigas Ilimitados en tu línea móvil principal desde el primer minuto.`
    }
  ];

  const isHighRisk = (selectedCliente?.score_churn || 0) > 0.45;

  // Función para parsear negritas estilo WhatsApp (*texto*) a HTML
  const renderWhatsAppText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <strong key={i} className="font-bold text-white">{part.slice(1, -1)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10 animate-fadeIn">
      
      {/* Header Superior con Branding y Selector Omnicanal */}
      <div className="bg-gradient-to-r from-[#005C84] via-[#0078A8] to-[#00C6D7] p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <MessageSquare className="w-48 h-48 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                WhatsApp Business API Oficial
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                handoverActive 
                  ? 'bg-amber-400/25 text-amber-200 border-amber-300/40 animate-pulse' 
                  : 'bg-emerald-400/25 text-emerald-100 border-emerald-300/40'
              }`}>
                {handoverActive ? '👨‍💼 Handover Asesor Conectado' : '🤖 Bot Autónomo Luz Activo'}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Bot Inteligente Luz — Canal WhatsApp Movistar
              <ShieldCheck className="w-7 h-7 text-emerald-300 fill-emerald-400/20 shrink-0" />
            </h1>
            <p className="text-sm text-sky-100 max-w-2xl font-medium">
              Flujo conversacional oficial de Movistar Perú con menú de autogestión, recomendación predictiva NBO y cierre en 1 clic.
            </p>
          </div>

          {/* Buscador de Cliente + Selector Rápido */}
          <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-3 min-w-[320px]">
            {/* Input de Búsqueda por ID / DNI */}
            <form onSubmit={handleSearchCliente} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sky-200" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar Cliente por ID o DNI..."
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/25 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-sky-200/70 outline-none focus:ring-2 focus:ring-emerald-400 transition"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-md flex items-center gap-1 shrink-0"
              >
                {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </form>

            {/* Quick Selector de Clientes Simulación */}
            <div>
              <span className="text-xs font-bold text-sky-100 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>Simular Clientes Demo:</span>
                <span className="text-[11px] font-mono opacity-80">{clientesList.length} en base</span>
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {clientesList.slice(0, 5).map((cli) => {
                  const isSel = selectedCliente?.cliente_id === cli.cliente_id;
                  const shortName = cli.nombre ? cli.nombre.split(' ')[0] : cli.cliente_id;
                  return (
                    <button
                      key={cli.cliente_id}
                      onClick={() => handleSelectCliente(cli)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isSel 
                          ? 'bg-white text-[#005C84] shadow-lg font-black' 
                          : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSel ? 'bg-[#7AB800]' : 'bg-emerald-400'}`} />
                      {shortName} ({cli.cliente_id})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: 65% Chat WhatsApp vs 35% Panel Copilot & NBO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: Ventana de Chat WhatsApp Business Real (7 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-[#0b141a] border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[700px] overflow-hidden relative">
          
          {/* Header de WhatsApp Business */}
          <div className="bg-[#1f2c34] px-4 py-3.5 border-b border-slate-800 flex items-center justify-between z-10 shadow-md">
            <div className="flex items-center gap-3.5">
              {/* Avatar con Branding Luz Movistar */}
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#005C84] via-[#00C6D7] to-[#7AB800] p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-[#061426] flex items-center justify-center text-white font-black text-sm">
                    <Bot className="w-6 h-6 text-[#00C6D7]" />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1f2c34]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                    Luz | Movistar Perú
                    <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold font-mono">
                    OFICIAL
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {handoverActive ? '👨‍💼 Asesor Humano Conectado en Vivo' : 'En línea • Respuesta Inmediata'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <Phone className="w-4 h-4 hover:text-white cursor-pointer transition opacity-80 hover:opacity-100" />
              <Video className="w-4 h-4 hover:text-white cursor-pointer transition opacity-80 hover:opacity-100" />
              <MoreVertical className="w-4 h-4 hover:text-white cursor-pointer transition opacity-80 hover:opacity-100" />
            </div>
          </div>

          {/* Banner de Encriptación y Seguridad WhatsApp */}
          <div className="bg-[#182229]/90 px-4 py-2 border-b border-slate-800/80 text-center">
            <p className="text-[11px] text-amber-300/90 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Los mensajes y llamadas están cifrados de extremo a extremo. Canal oficial verificado Movistar.
            </p>
          </div>

          {/* Cuerpo de Mensajes con Wallpaper WhatsApp Texturizado */}
          <div 
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0b141a]"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0, 92, 132, 0.05) 0%, transparent 100%)`
            }}
          >
            {messages.map((m) => {
              if (m.sender === 'system') {
                return (
                  <div key={m.id} className="flex justify-center my-3">
                    <span className="bg-[#182229] border border-blue-500/40 text-blue-300 text-xs px-4 py-2 rounded-full font-semibold shadow-lg text-center flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-blue-400 shrink-0" />
                      {m.text}
                    </span>
                  </div>
                );
              }

              const isMe = m.sender === 'cliente';
              const isBot = m.sender === 'bot';
              const isAdvisor = m.sender === 'asesor';

              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[88%] md:max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-xl transition-all ${
                      isMe
                        ? 'bg-[#005c4b] text-white rounded-tr-none border border-emerald-600/30'
                        : isAdvisor
                        ? 'bg-blue-950 border border-blue-500/50 text-white rounded-tl-none'
                        : 'bg-[#1f2c34] text-white rounded-tl-none border border-slate-700/60'
                    }`}
                  >
                    {!isMe && (
                      <div className="flex items-center justify-between gap-2 pb-1 mb-1.5 border-b border-slate-700/50">
                        <span className="text-xs font-black text-[#00C6D7] flex items-center gap-1.5">
                          {isBot ? '🤖 Luz • Asistente Virtual Movistar' : '👨‍💼 Asesor Humano Movistar'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">Verificado</span>
                      </div>
                    )}

                    {/* Texto del mensaje con formato WhatsApp */}
                    <div className="whitespace-pre-line leading-relaxed text-sm font-normal text-slate-100">
                      {renderWhatsAppText(m.text)}
                    </div>

                    {/* Menú Interactivo Principal de Luz (7 Opciones Reales) */}
                    {m.isMenu && (
                      <div className="mt-3.5 pt-3 border-t border-slate-700/70 space-y-2">
                        <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                          Opciones Disponibles:
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {BOT_MENU_OPTIONS.map((opt) => {
                            const IconComp = opt.icon;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleMenuClick(opt.id, opt.label)}
                                className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer shadow-sm ${
                                  opt.highlight
                                    ? 'bg-[#005C84]/40 hover:bg-[#00C6D7] hover:text-slate-950 border-[#00C6D7]/60 text-white'
                                    : 'bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-slate-200 border-slate-700/70'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${opt.highlight ? 'bg-[#00C6D7] text-slate-950' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-950'}`}>
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate group-hover:text-slate-950">{opt.label}</p>
                                    <p className="text-[11px] opacity-75 truncate group-hover:text-slate-900">{opt.desc}</p>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition shrink-0 ml-2" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Card de Oferta NBO Destacada dentro del Chat */}
                    {m.isOfferCard && m.oferta && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#061426] to-[#005C84]/40 border border-[#00C6D7]/50 shadow-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#7AB800] text-slate-950 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 fill-current" /> OFERTA NBO
                          </span>
                          <span className="text-xs font-bold text-[#00C6D7]">
                            {(m.oferta.prob_aceptacion ? m.oferta.prob_aceptacion * 100 : 88).toFixed(0)}% Recomendación
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white">{m.oferta.nombre_oferta}</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-[#7AB800]">S/ {m.oferta.precio_promocional}</span>
                          <span className="text-xs text-slate-400 line-through">S/ {m.oferta.precio_regular}</span>
                          {m.oferta.ahorro_pct > 0 && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-[#00C6D7]/20 text-[#00C6D7] border border-[#00C6D7]/40">
                              Ahorras {m.oferta.ahorro_pct}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botones Interactivos WhatsApp (Quick Replies) */}
                    {m.interactiveButtons && (
                      <div className="mt-3.5 pt-3 border-t border-slate-700/60 space-y-2">
                        <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
                          Respuestas rápidas disponibles:
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {m.interactiveButtons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleInteractiveClick(btn.action, btn.label)}
                              className="w-full bg-[#2a3942] hover:bg-[#00a884] hover:text-slate-950 text-emerald-300 font-bold text-xs py-2.5 px-3.5 rounded-xl border border-slate-700/60 transition flex items-center justify-between text-left cursor-pointer shadow-md group"
                            >
                              <span>{btn.label}</span>
                              <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamp y Vistos Dobles de WhatsApp */}
                    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mt-2 font-mono">
                      <span>{m.time}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator con 3 puntos animados WhatsApp */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-[#1f2c34] text-slate-300 text-xs px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700/60 flex items-center gap-2 shadow-md">
                  <span className="text-xs font-bold text-[#00C6D7]">Luz está escribiendo</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Barra de Entrada / Handover Bar Inferior */}
          {handoverActive ? (
            <form onSubmit={handleSendMessage} className="bg-[#202c33] p-3 border-t border-slate-800 flex items-center gap-2 z-10">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe como Asesor Humano o usa las respuestas sugeridas a la derecha..."
                className="flex-1 bg-[#2a3942] text-white text-xs md:text-sm px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-3 rounded-2xl transition cursor-pointer shadow-lg shadow-blue-500/20 flex items-center gap-1 shrink-0"
                title="Enviar mensaje de asesor"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="bg-[#202c33] p-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
              <form onSubmit={handleSendMessage} className="flex-1 w-full flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe una pregunta para el Bot Luz (ej. 'quiero ver ofertas')..."
                  className="flex-1 bg-[#2a3942] text-white text-xs md:text-sm px-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#00C6D7] transition placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-[#005C84] hover:bg-[#00C6D7] hover:text-slate-950 disabled:opacity-40 text-white p-2.5 rounded-2xl transition cursor-pointer shadow-md shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <button
                onClick={() => {
                  setHandoverActive(true);
                  setActiveTabPanel('quick_replies');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0 shadow"
              >
                <Headphones className="w-3.5 h-3.5 text-[#00C6D7]" /> Activar Handover Humano
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: Consola de Inteligencia NBO & Copilot Asesor (5 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">

          {/* Selector de Pestañas del Panel Derecho */}
          <div className={`flex items-center gap-2 p-1.5 rounded-2xl border transition-colors duration-300 ${
            isDark ? 'bg-[#061426] border-[#005C84]/30' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTabPanel('ia_context')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTabPanel === 'ia_context'
                  ? 'bg-[#005C84] text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-[#005C84]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00C6D7]" /> Contexto IA & NBO
            </button>
            <button
              onClick={() => setActiveTabPanel('quick_replies')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTabPanel === 'quick_replies'
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-300" /> Respuestas Asesor
            </button>
          </div>

          {/* PESTAÑA 1: Contexto de IA y Perfil NBO */}
          {activeTabPanel === 'ia_context' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Tarjeta de Diagnóstico del Cliente */}
              <div className={`border rounded-3xl p-5 shadow-xl space-y-4 transition-all duration-300 ${
                isDark 
                  ? 'bg-[#061426]/90 border-[#005C84]/40 text-white shadow-black/40' 
                  : 'bg-white border-[#005C84]/15 text-[#002D42] shadow-[#005C84]/10'
              }`}>
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isDark ? 'border-[#005C84]/20' : 'border-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className={`text-sm font-black uppercase tracking-wider ${
                      isDark ? 'text-white' : 'text-[#005C84]'
                    }`}>
                      Perfil del Cliente en Sesión
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    isHighRisk 
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                  }`}>
                    {isHighRisk ? '🔥 Churn Crítico' : 'Elegible NBO'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-2xl border ${
                    isDark ? 'bg-[#030914] border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`font-medium block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Nombre / DNI</span>
                    <span className={`font-bold text-sm truncate block mt-0.5 ${isDark ? 'text-white' : 'text-[#002D42]'}`}>
                      {selectedCliente?.nombre}
                    </span>
                    <span className={`font-mono text-xs ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>
                      DNI: {selectedCliente?.dni || selectedCliente?.cliente_id}
                    </span>
                  </div>

                  <div className={`p-3 rounded-2xl border ${
                    isDark ? 'bg-[#030914] border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`font-medium block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Plan Actual</span>
                    <span className={`font-bold text-sm truncate block mt-0.5 ${isDark ? 'text-sky-400' : 'text-[#005C84]'}`}>
                      {selectedCliente?.plan_actual_nombre}
                    </span>
                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-[#7AB800]'}`}>
                      S/ {selectedCliente?.plan_actual_precio}/mes
                    </span>
                  </div>
                </div>

                {/* Métricas de Riesgo y Scoring */}
                <div className={`p-3 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-[#030914] border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Propensión a Paquetes Movistar Total:</span>
                    <span className="text-[#7AB800] font-black text-sm">
                      {((1 - (selectedCliente?.score_churn || 0.2)) * 100).toFixed(0)}% Alta
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div 
                      className="bg-gradient-to-r from-[#005C84] via-[#00C6D7] to-[#7AB800] h-2 rounded-full" 
                      style={{ width: `${(1 - (selectedCliente?.score_churn || 0.2)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Oferta NBO Recomendada por el Modelo */}
              {currentDisplayOffer && (
                <div className={`border rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#061426] via-slate-900 to-[#005C84]/30 border-[#00C6D7]/40 shadow-black/40' 
                    : 'bg-gradient-to-br from-white via-sky-50/30 to-white border-[#005C84]/20 shadow-[#005C84]/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00C6D7] text-slate-950 flex items-center gap-1.5 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      Oferta Contextual NBO
                    </span>
                    <span className="text-xs font-mono text-[#7AB800] font-black">
                      {((currentDisplayOffer.prob_aceptacion || 0.85) * 100).toFixed(0)}% Aceptación
                    </span>
                  </div>

                  <div>
                    <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                      {currentDisplayOffer.nombre_oferta}
                    </h4>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      <span className="text-3xl font-black text-[#7AB800]">
                        S/ {currentDisplayOffer.precio_promocional}/mes
                      </span>
                      <span className={`text-sm line-through ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                        S/ {currentDisplayOffer.precio_regular}
                      </span>
                      {currentDisplayOffer.ahorro_pct > 0 && (
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                          isDark 
                            ? 'text-[#00C6D7] bg-[#00C6D7]/20 border-[#00C6D7]/40' 
                            : 'text-[#005C84] bg-sky-100 border-sky-300'
                        }`}>
                          -{currentDisplayOffer.ahorro_pct}% DCTO
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                    isDark ? 'bg-[#030914]/80 border-[#00C6D7]/20' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'
                    }`}>
                      Estado de Automatización en WhatsApp:
                    </span>
                    <p className={`text-xs leading-relaxed font-medium ${
                      isDark ? 'text-slate-300' : 'text-[#002D42]'
                    }`}>
                      {handoverActive 
                        ? '⚠️ El Bot Luz transfirió la sesión al Asesor Humano. Puedes enviar argumentos con 1 clic en la pestaña "Respuestas Asesor".' 
                        : '✅ El Bot Luz está gestionando la oferta con botones interactivos y respuesta inmediata.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 2: Respuestas Rápidas para el Asesor Humano (Handover) */}
          {activeTabPanel === 'quick_replies' && (
            <div className={`border rounded-3xl p-5 shadow-xl space-y-4 animate-fadeIn transition-all duration-300 ${
              isDark 
                ? 'bg-[#061426]/95 border-blue-500/40 shadow-black/40' 
                : 'bg-white border-blue-200 shadow-blue-500/10'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                  isDark ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  Respuestas Rápidas Asesor (1 Clic)
                </span>
                <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                  isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/30' : 'text-blue-800 bg-blue-50 border-blue-200'
                }`}>
                  {handoverActive ? 'Handover Activo' : 'Modo Asesor Disponible'}
                </span>
              </div>

              <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                Haz clic en <strong>Enviar Directo</strong> para publicar el mensaje en el chat o en <strong>Editar</strong> para personalizarlo antes de enviar:
              </p>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {handoverSuggestedMessages.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-2xl border transition group space-y-2 shadow-sm ${
                      isDark 
                        ? 'bg-[#030914] border-slate-800 hover:border-blue-500/50' 
                        : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <span className={`text-xs font-extrabold transition block ${
                      isDark ? 'text-white group-hover:text-blue-300' : 'text-[#005C84] group-hover:text-blue-700'
                    }`}>
                      {item.titulo}
                    </span>

                    <p className={`text-xs italic leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-[#002D42]'
                    }`}>
                      "{item.texto}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setInputText(item.texto)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Pegar en la caja de texto para editar"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Editar
                      </button>

                      <button
                        onClick={() => handleSendDirectSuggested(item.texto)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md"
                        title="Enviar directamente al chat"
                      >
                        <SendHorizontal className="w-3.5 h-3.5" /> Enviar Directo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback message banner */}
          {feedbackMsg && (
            <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-black shadow-lg animate-fadeIn ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              <div className="flex items-center gap-2">
                {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                <span>{feedbackMsg.text}</span>
              </div>
            </div>
          )}

          {/* Botones de Cierre Comercial y Rebate */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setIsRebateOpen(true)}
              className="py-3 px-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <XCircle className="w-4 h-4" />
              Rebate IA / Objeción
            </button>

            <button
              onClick={async () => {
                await api.registrarGestion({
                  cliente_id: selectedCliente.cliente_id,
                  canal: 'WhatsApp',
                  oferta_id: currentDisplayOffer.oferta_id,
                  oferta_nombre: currentDisplayOffer.nombre_oferta,
                  es_movistar_total: currentDisplayOffer.es_movistar_total || currentDisplayOffer.oferta_id?.startsWith("OF020") || currentDisplayOffer.oferta_id?.startsWith("MT"),
                  estado: 'ACEPTADA',
                  precio_oferta: currentDisplayOffer.precio_promocional,
                  ahorro_pct: currentDisplayOffer.ahorro_pct
                });
                setFeedbackMsg({ type: 'success', text: `¡Venta por WhatsApp cerrada con éxito para ${selectedCliente.cliente_id}!` });
                setTimeout(() => setFeedbackMsg(null), 5000);
              }}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#7AB800] to-emerald-500 hover:from-emerald-500 hover:to-[#7AB800] text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Venta NBO
            </button>
          </div>

        </div>

      </div>

      {/* Modal de Rebate IA */}
      {selectedCliente && currentDisplayOffer && (
        <RebateModal
          isOpen={isRebateOpen}
          onClose={() => setIsRebateOpen(false)}
          cliente={selectedCliente}
          oferta={currentDisplayOffer}
          canal="WhatsApp"
          onConfirmReject={async (motivo) => {
            await api.registrarGestion({
              cliente_id: selectedCliente.cliente_id,
              canal: 'WhatsApp',
              oferta_id: currentDisplayOffer.oferta_id,
              oferta_nombre: currentDisplayOffer.nombre_oferta,
              es_movistar_total: currentDisplayOffer.es_movistar_total || false,
              estado: 'RECHAZADA',
              motivo_rechazo: motivo,
              precio_oferta: currentDisplayOffer.precio_promocional,
              ahorro_pct: currentDisplayOffer.ahorro_pct
            });
            setFeedbackMsg({ type: 'reject', text: `Rechazo registrado para ${selectedCliente.cliente_id}. Motivo: ${motivo}` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
          onAcceptAfterRebate={async () => {
            await api.registrarGestion({
              cliente_id: selectedCliente.cliente_id,
              canal: 'WhatsApp',
              oferta_id: currentDisplayOffer.oferta_id,
              oferta_nombre: currentDisplayOffer.nombre_oferta,
              es_movistar_total: currentDisplayOffer.es_movistar_total || false,
              estado: 'ACEPTADA',
              precio_oferta: currentDisplayOffer.precio_promocional,
              ahorro_pct: currentDisplayOffer.ahorro_pct
            });
            setFeedbackMsg({ type: 'success', text: `¡Rebate Exitoso por WhatsApp! Venta salvada para ${selectedCliente.cliente_id}.` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
        />
      )}

    </div>
  );
}
