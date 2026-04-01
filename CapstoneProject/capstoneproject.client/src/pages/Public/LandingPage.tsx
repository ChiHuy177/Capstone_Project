import { useEffect } from 'react';
import { Button, Typography, Row, Col, Card } from 'antd';
import {
    MessageOutlined,
    FileSearchOutlined,
    ThunderboltOutlined,
    SafetyOutlined,
    TeamOutlined,
    CloudServerOutlined,
    ArrowRightOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    BankOutlined,
    RobotOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.scss';

const { Title, Paragraph, Text } = Typography;

const ImagePlaceholder = ({
    icon,
    label,
    className,
}: {
    icon: React.ReactNode;
    label: string;
    className?: string;
}) => (
    <div className={`image-placeholder ${className || ''}`}>
        <div className="image-placeholder-content">
            {icon}
            <span>{label}</span>
        </div>
    </div>
);

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
    }),
};

const features = [
    {
        icon: <MessageOutlined style={{ fontSize: 36, color: '#184066' }} />,
        title: 'Chatbot AI Thông Minh',
        desc: 'Hỗ trợ giải đáp thắc mắc tự động 24/7 với công nghệ AI tiên tiến, giúp sinh viên và giảng viên tiết kiệm thời gian.',
    },
    {
        icon: <FileSearchOutlined style={{ fontSize: 36, color: '#184066' }} />,
        title: 'Tra Cứu Tài Liệu',
        desc: 'Tìm kiếm và truy xuất thông tin từ kho tài liệu của trường một cách nhanh chóng và chính xác.',
    },
    {
        icon: <ThunderboltOutlined style={{ fontSize: 36, color: '#184066' }} />,
        title: 'Phản Hồi Tức Thì',
        desc: 'Xử lý và phản hồi câu hỏi trong thời gian thực, đảm bảo trải nghiệm mượt mà cho người dùng.',
    },
    {
        icon: <SafetyOutlined style={{ fontSize: 36, color: '#184066' }} />,
        title: 'Bảo Mật Dữ Liệu',
        desc: 'Hệ thống được bảo mật nghiêm ngặt, đảm bảo an toàn thông tin cho người dùng và nhà trường.',
    },
    {
        icon: <TeamOutlined style={{ fontSize: 36, color: '#184066' }} />,
        title: 'Hỗ Trợ Đa Người Dùng',
        desc: 'Phục vụ đồng thời nhiều người dùng với hiệu suất ổn định, từ sinh viên đến cán bộ nhà trường.',
    },
    {
        icon: <CloudServerOutlined style={{ fontSize: 36, color: '#184066' }} />,
        title: 'Tích Hợp RAG',
        desc: 'Ứng dụng công nghệ Retrieval-Augmented Generation để cung cấp câu trả lời chính xác dựa trên dữ liệu thực.',
    },
];

const stats = [
    { value: '24/7', label: 'Hoạt động liên tục' },
    { value: '< 3s', label: 'Thời gian phản hồi' },
    { value: '1000+', label: 'Tài liệu hỗ trợ' },
    { value: '99%', label: 'Độ chính xác' },
];

const LandingPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const script = document.createElement('script');
        script.src = '/scriptChatBox.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup: remove script and chat elements
            script.remove();
            document.getElementById('chat-bubble')?.parentElement?.remove();
            document.getElementById('chat-window')?.parentElement?.remove();
            // Reset flag so script can reinitialize
            (window as any).chatBoxInitialized = false;
        };
    }, []);

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="landing-container header-inner">
                    <div className="header-logo">
                        <img src="/EIU_Logo.png" alt="EIU Logo" className="header-logo-img" />
                    </div>
                    <nav className="header-nav">
                        <a href="#about">Giới thiệu</a>
                        <a href="#features">Tính năng</a>
                        <a href="#contact">Liên hệ</a>
                        <Button
                            type="primary"
                            className="header-login-btn"
                            onClick={() => navigate('/login')}
                        >
                            Đăng nhập
                        </Button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay" />
                <div className="landing-container hero-content">
                    <Row align="middle" gutter={[48, 48]}>
                        <Col xs={24} md={12}>
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={fadeUp}
                                custom={0}
                            >
                                <Text className="hero-badge">EIU Smart Assistant</Text>
                                <Title level={1} className="hero-title">
                                    Hệ Thống Chatbot AI
                                    <br />
                                    <span className="hero-highlight">
                                        Đại Học Quốc Tế Miền Đông
                                    </span>
                                </Title>
                                <Paragraph className="hero-desc">
                                    Giải pháp hỗ trợ thông tin thông minh dành cho sinh viên, giảng
                                    viên và cán bộ nhà trường. Trả lời mọi thắc mắc nhanh chóng,
                                    chính xác với công nghệ AI hiện đại.
                                </Paragraph>
                                <div className="hero-actions">
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="hero-btn-primary"
                                        onClick={() => navigate('/register')}
                                        icon={<ArrowRightOutlined />}
                                    >
                                        Bắt đầu ngay
                                    </Button>
                                    <Button
                                        size="large"
                                        className="hero-btn-secondary"
                                        onClick={() => {
                                            document
                                                .getElementById('features')
                                                ?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        Tìm hiểu thêm
                                    </Button>
                                </div>
                            </motion.div>
                        </Col>
                        <Col xs={24} md={12}>
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={fadeUp}
                                custom={2}
                                className="hero-image-wrapper"
                            >
                                <img src="/AI-img.png" alt="EIU Campus" className="hero-image" />
                            </motion.div>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="landing-container">
                    <Row gutter={[24, 24]} justify="center">
                        {stats.map((stat, i) => (
                            <Col xs={12} sm={6} key={i}>
                                <motion.div
                                    className="stat-card"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.3 }}
                                    variants={fadeUp}
                                    custom={i}
                                >
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="landing-container">
                    <Row align="middle" gutter={[48, 48]}>
                        <Col xs={24} md={12}>
                            <div className="about-images-stack">
                                <motion.div
                                    className="about-img-main"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.3 }}
                                    variants={fadeUp}
                                    custom={0}
                                >
                                    <img
                                        src="/EIU.jpg"
                                        alt="EIU University"
                                        className="about-image"
                                    />
                                </motion.div>
                                <motion.div
                                    className="about-img-overlay"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.3 }}
                                    variants={fadeUp}
                                    custom={2}
                                >
                                    <img
                                        src="/EIU_2.jpg"
                                        alt="EIU AI Chatbot"
                                        className="about-image"
                                    />
                                </motion.div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.3 }}
                                variants={fadeUp}
                                custom={1}
                            >
                                <Text className="section-tag">Về chúng tôi</Text>
                                <Title level={2} className="section-title">
                                    Trường Đại Học Quốc Tế Miền Đông
                                </Title>
                                <Paragraph className="about-text">
                                    Trường Đại học Quốc tế Miền Đông (Eastern International
                                    University - EIU) là một trong những trường đại học hàng đầu tại
                                    Bình Dương, với sứ mệnh đào tạo nguồn nhân lực chất lượng cao,
                                    đáp ứng nhu cầu hội nhập quốc tế.
                                </Paragraph>
                                <Paragraph className="about-text">
                                    Hệ thống Chatbot AI của EIU được phát triển nhằm hỗ trợ cộng
                                    đồng sinh viên và giảng viên trong việc tra cứu thông tin, giải
                                    đáp thắc mắc về quy chế, chương trình đào tạo, và các hoạt động
                                    của nhà trường một cách nhanh chóng và tiện lợi.
                                </Paragraph>
                                <Paragraph className="about-text">
                                    Với công nghệ Retrieval-Augmented Generation (RAG), chatbot có
                                    khả năng trả lời chính xác dựa trên nguồn dữ liệu chính thức của
                                    nhà trường.
                                </Paragraph>
                            </motion.div>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="landing-container">
                    <motion.div
                        className="section-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <Text className="section-tag">Tính năng</Text>
                        <Title level={2} className="section-title">
                            Những Tính Năng Nổi Bật
                        </Title>
                        <Paragraph className="section-subtitle">
                            Hệ thống được trang bị những công nghệ hiện đại nhất để mang đến trải
                            nghiệm tốt nhất cho người dùng
                        </Paragraph>
                    </motion.div>

                    <Row gutter={[24, 24]}>
                        {features.map((f, i) => (
                            <Col xs={24} sm={12} lg={8} key={i}>
                                <motion.div
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.2 }}
                                    variants={fadeUp}
                                    custom={i}
                                    style={{ height: '100%' }}
                                >
                                    <Card className="feature-card" hoverable>
                                        <div className="feature-icon">{f.icon}</div>
                                        <Title level={4} className="feature-title">
                                            {f.title}
                                        </Title>
                                        <Paragraph className="feature-desc">{f.desc}</Paragraph>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="landing-container">
                    <motion.div
                        className="cta-content"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <Title level={2} className="cta-title">
                            Sẵn sàng trải nghiệm?
                        </Title>
                        <Paragraph className="cta-desc">
                            Đăng ký tài khoản ngay hôm nay để sử dụng hệ thống Chatbot AI của Trường
                            Đại học Quốc tế Miền Đông
                        </Paragraph>
                        <div className="cta-actions">
                            <Button
                                type="primary"
                                size="large"
                                className="hero-btn-primary"
                                onClick={() => navigate('/register')}
                            >
                                Đăng ký miễn phí
                            </Button>
                            <Button
                                size="large"
                                className="cta-btn-ghost"
                                onClick={() => navigate('/login')}
                            >
                                Đã có tài khoản? Đăng nhập
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="landing-footer">
                <div className="landing-container">
                    <Row gutter={[48, 36]}>
                        <Col xs={24} md={8}>
                            <div className="footer-brand">
                                <img src="/EIU_Logo.png" alt="EIU Logo" className="footer-logo" />
                                <Paragraph className="footer-brand-text">
                                    Hệ thống Chatbot AI hỗ trợ thông tin dành cho cộng đồng Trường
                                    Đại học Quốc tế Miền Đông.
                                </Paragraph>
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <Title level={5} className="footer-heading">
                                Liên kết nhanh
                            </Title>
                            <ul className="footer-links">
                                <li>
                                    <a href="#about">Giới thiệu</a>
                                </li>
                                <li>
                                    <a href="#features">Tính năng</a>
                                </li>
                                <li>
                                    <a
                                        href="https://eiu.edu.vn"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Website EIU
                                    </a>
                                </li>
                            </ul>
                        </Col>
                        <Col xs={24} md={8}>
                            <Title level={5} className="footer-heading">
                                Liên hệ
                            </Title>
                            <ul className="footer-contact">
                                <li>
                                    <EnvironmentOutlined />
                                    <span>Khu phố 6, phường Bình An, TP. Dĩ An, Bình Dương</span>
                                </li>
                                <li>
                                    <PhoneOutlined />
                                    <span>(0274) 222 0066</span>
                                </li>
                                <li>
                                    <MailOutlined />
                                    <span>info@eiu.edu.vn</span>
                                </li>
                            </ul>
                        </Col>
                    </Row>
                    <div className="footer-bottom">
                        <Text className="footer-copyright">
                            &copy; {new Date().getFullYear()} Trường Đại học Quốc tế Miền Đông
                            (EIU). All rights reserved.
                        </Text>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
