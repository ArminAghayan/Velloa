import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Spin, Space, Empty, Image, Button, Input, Drawer, Slider, Select, Divider, Modal, Avatar } from 'antd';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { IconFilter, IconMail, IconFileDescription, IconBuilding, IconCalendar, IconClipboardText, IconChevronLeft, IconShare2 } from '@tabler/icons-react';
import './ListingPage.css';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { message } from 'antd';

const { Title, Text } = Typography;

interface Listing {
  id: string;
  propertyId: string;
  beds?: number;
  baths?: number;
  size?: number;
  marketRent?: number;
  status: string;
  ListingTitle?: string;
  ListingDescription?: string;
  propertyName?: string;
  photos?: Array<{
    fileUrl: string;
    id?: string;
    isVideo?: boolean;
    favorite?: boolean;
  }>;
  contactInfo?: {
    type: 'user' | 'custom';
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  propertySettings?: {
    propertyKind: string;
    propertyType: string;
  };
  amenities?: {
    Cooling?: { [key: string]: string }[];
    Heating?: { [key: string]: string }[];
    Parking?: { [key: string]: string }[]; 
  };
}

interface ListingModalProps {
  visible: boolean;
  onClose: () => void;
  listing: Listing | null;
}

const formatPhoneNumber = (phoneNumber: string) => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  // Format as (XXX)-XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]})-${match[2]}-${match[3]}`;
  }
  return phoneNumber;
};

const handleCopy = (text: string, type: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      message.success(`${type} copied to clipboard`);
    })
    .catch(() => {
      message.error('Failed to copy to clipboard');
    });
};

const ListingModal: React.FC<ListingModalProps> = ({ visible, onClose, listing }) => {
  const photos = listing?.photos || [];
  const mainPhoto = photos[0]?.fileUrl || '/placeholder-image.jpg';

  // Construct address string for Google Maps
  const addressString = listing?.address
    ? `${listing.address.street1 || ''} ${listing.address.street2 || ''}, ${listing.address.city || ''}, ${listing.address.state || ''} ${listing.address.zip || ''}`
    : '';

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      closeIcon={null}
      footer={null}
      width={1250}
      bodyStyle={{ padding: 0 }}
      style={{ top: 20 }}
    >
      <div style={{ width: '100%', background: '#fff', borderRadius: 8 }}>
        <Row 
          justify="space-between" 
          align="middle" 
          style={{ 
            padding: '0px 12px'
          }}
        >
          <Button 
            icon={<IconChevronLeft size={18} />}
            onClick={onClose}
            type="text"
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '4px' 
            }}
          >
            Back to listings
          </Button>
          <Button
            icon={<IconShare2 size={18} />}
            type="text"
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '4px' 
            }}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (navigator.share) {
                  // Use Web Share API if available
                  await navigator.share({
                    title: listing?.ListingTitle || 'Property Listing',
                    text: `Check out this property: ${listing?.ListingTitle}`,
                    url: window.location.href
                  });
                } else {
                  // Fallback to clipboard
                  await navigator.clipboard.writeText(window.location.href);
                }
              } catch (error) {
                console.error('Error sharing:', error);
              }
            }}
          >
            Share
          </Button>
        </Row>

        <div style={{ position: 'relative' }}>
          {/* Image Grid Container */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: '4px',
              padding: '12px',
              height: '380px',
              background: '#fff'
            }}
          >
            {/* Main Image */}
            <div 
              style={{ 
                gridRow: '1 / span 2',
                position: 'relative',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <Image
                src={mainPhoto}
                alt="Main property view"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                preview={false}
              />
            </div>

            {/* Right Column Images - Now showing 4 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: '4px',
                gridColumn: '2',
                gridRow: '1 / span 2'
              }}
            >
              {photos.slice(1, 5).map((photo, index) => (
                <div
                  key={photo.id || index}
                  style={{
                    position: 'relative',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    height: '100%'
                  }}
                >
                  <Image
                    src={photo.fileUrl}
                    alt={`Property view ${index + 2}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    preview={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* See all photos button */}
          <Button
            type="default"
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              background: 'white',
              borderRadius: '8px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '4px' }}>
                <path
                  fill="currentColor"
                  d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
                />
              </svg>
              See all {photos.length} photos
            </span>
          </Button>
        </div>

        {/* Content Section Below Images */}
        <div style={{ padding: '24px' }}>
          <Row gutter={24}>
            {/* Left Column */}
            <Col xs={24} md={16}>
              {/* Property Details */}
              <Row justify="space-between" align="top" style={{ marginBottom: '24px' }}>
                <Col>
                  <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                    ${listing?.marketRent}/mo
                  </Title>
                  <Text style={{ fontSize: '16px', color: '#666' }}>
                    {addressString}
                  </Text>
                </Col>
                <Col>
                  <Row gutter={32} style={{ textAlign: 'left' }}>
                    <Col style={{ minWidth: '60px' }}>
                      <Title level={2} style={{ margin: 0 }}>
                        {listing?.beds}
                      </Title>
                      <Text style={{ color: '#888', fontSize: '16px' }}>
                        Beds
                      </Text>
                    </Col>
                    <Col style={{ minWidth: '60px' }}>
                      <Title level={2} style={{ margin: 0 }}>
                        {listing?.baths}
                      </Title>
                      <Text style={{ color: '#888', fontSize: '16px' }}>
                        Baths
                      </Text>
                    </Col>
                    <Col style={{ minWidth: '60px' }}>
                      <Title level={2} style={{ margin: 0 }}>
                        {listing?.size}
                      </Title>
                      <Text style={{ color: '#888', fontSize: '16px' }}>
                        Sqft.
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Features Section */}
              <Row gutter={[8, 8]}>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                  }}>
                    <IconBuilding size={18} />
                    <Text>{listing?.propertySettings?.propertyKind || 'Not specified'}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                  }}>
                    <IconBuilding size={18} />
                    <Text>{listing?.propertySettings?.propertyType || 'Not specified'}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                  }}>
                    <IconCalendar size={18} />
                    <Text>Available Now</Text>
                  </div>
                </Col>

              </Row>
              <Divider />

              {/* About this property section */}
              <Title level={3}>About this property</Title>
              <Text style={{ fontSize: '16px' }}>{listing?.ListingDescription}</Text>

              <Divider />

              {/* Location Section with Google Map */}
              <div style={{ width: '100%', height: '300px' }}>
                <iframe
                  title={`Map location for ${addressString}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border:0, borderRadius: '8px' }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(addressString)}&output=embed`}
                  allowFullScreen
                />
              </div>

              {/* Facts and Features Section */}
              <Divider />
              <Title level={3}>Facts and Features</Title>

              <Row gutter={[24, 24]}>
                {/* Interior Section */}
                <Col span={24}>
                  <Title level={4} style={{ color: '#666' }}>Interior</Title>
                  <Row gutter={[48, 24]}>
                    <Col xs={24} md={8}>
                      <Title level={5}>Bedrooms & bathrooms</Title>
                      <Space direction="vertical">
                        <Text>Bedrooms: {listing?.beds}</Text>
                        <Text>Bathrooms: {listing?.baths}</Text>
                        <Text>Full bathrooms: {listing?.baths}</Text>
                      </Space>
                    </Col>
                    <Col xs={24} md={8}>
                      <Title level={5}>Heating</Title>
                      <Text>
                        {listing?.amenities?.Heating?.map(item => Object.values(item)[0]).join(', ') || 'Forced Air'}
                      </Text>
                    </Col>
                    <Col xs={24} md={8}>
                      <Title level={5}>Cooling</Title>
                      <Text>
                        {listing?.amenities?.Cooling?.map(item => Object.values(item)[0]).join(', ') || 'Central Air'}
                      </Text>
                    </Col>
                    <Col xs={24} md={8}>
                      <Title level={5}>Appliances</Title>
                      <Text>Included: Dishwasher, Dryer, Freezer, Microwave, Refrigerator, Washer</Text>
                      <Text>Laundry: In Unit</Text>
                    </Col>
                    <Col xs={24} md={8}>
                      <Title level={5}>Features</Title>
                      <Text>Flooring: Hardwood</Text>
                    </Col>
                    <Col xs={24} md={8}>
                      <Title level={5}>Interior area</Title>
                      <Text>Total interior livable area: {listing?.size} sqft</Text>
                    </Col>
                  </Row>
                </Col>

                {/* Property Section */}
                <Col span={24}>
                  <Title level={4} style={{ color: '#666' }}>Property</Title>
                  <Row gutter={[48, 24]}>
                    <Col xs={24} md={8}>
                      <Title level={5}>Parking</Title>
                      <Text>
                        {listing?.amenities?.Parking?.map(item => Object.values(item)[0]).join(', ') || 'Contact manager'}
                      </Text>
                    </Col>
                    <Col xs={24} md={16}>
                      <Title level={5}>Features</Title>
                      <Text>
                        Exterior features: Bicycle storage, Common workspace area, Electricity not included in rent, 
                        Heating system: Forced Air, Party Room, Pet wash area, Rooftop Deck, Water included in rent
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>

            {/* Right Column */}
            <Col xs={24} md={8}>
              <div style={{ position: 'sticky', top: '24px' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    block 
                    size="large"
                    icon={<IconMail size={18} />}
                  >
                    Contact Us
                  </Button>
                  <Button 
                    block 
                    size="large"
                    icon={<IconClipboardText size={18} />}
                  >
                    Request to apply
                  </Button>

                  {/* Contact Card */}
                  <Card style={{ width: '100%', marginTop: '16px' }}>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <Avatar 
                        size={64}
                        style={{ 
                          backgroundColor: '#f0f0f0',
                          color: '#595959',
                          fontSize: '24px'
                        }}
                      >
                        {listing?.contactInfo ? (
                          `${listing.contactInfo.firstName?.[0] || ''}${listing.contactInfo.lastName?.[0] || ''}`
                        ) : 'NA'}
                      </Avatar>
                      <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>
                        {listing?.contactInfo ? (
                          <>
                            {listing.contactInfo.firstName}
                            {' '}
                            {listing.contactInfo.lastName}
                          </>
                        ) : 'No Contact Set'}
                      </Text>
                      <Space direction="vertical" align="center">
                        {listing?.contactInfo?.email && (
                          <Button 
                            type="text" 
                            icon={<MailOutlined />}
                            style={{ color: '#595959' }}
                            onClick={() => handleCopy(listing?.contactInfo?.email!, 'Email')}
                          >
                            {listing?.contactInfo?.email}
                          </Button>
                        )}
                        {listing?.contactInfo?.phoneNumber && (
                          <Button 
                            type="text" 
                            icon={<PhoneOutlined />}
                            style={{ color: '#595959' }}
                            onClick={() => handleCopy(listing?.contactInfo?.phoneNumber!, 'Phone number')}
                          >
                            {formatPhoneNumber(listing?.contactInfo?.phoneNumber!)}
                          </Button>
                        )}
                      </Space>
                    </Space>
                  </Card>
                </Space>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
};



const ListingsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    beds: undefined as number | undefined,
    baths: undefined as number | undefined,
    sqftRange: [0, 5000],
  });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      if (!companyId) {
        setError('No company ID provided');
        setLoading(false);
        return;
      }

      try {
        const listingsRef = collection(db, 'listings');
        const q = query(listingsRef, where('companyId', '==', companyId));
        
        const listingsSnapshot = await getDocs(q);
        
        if (listingsSnapshot.empty) {
          throw new Error('No listings found for this company');
        }

        const fetchedListings = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Listing));

        setListings(fetchedListings);

      } catch (error) {
        console.error('Detailed error:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof Error ? (error as any).code : null
        });
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [companyId]);

  // Add effect to handle direct navigation to a listing
  useEffect(() => {
    const listingId = new URLSearchParams(location.search).get('listingId');
    if (listingId && listings.length > 0) {
      const listing = listings.find(l => l.id === listingId);
      if (listing) {
        setSelectedListing(listing);
        setIsModalOpen(true);
      }
    }
  }, [listings, location.search]);

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredListings = listings.filter(listing => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (listing.ListingTitle?.toLowerCase().includes(searchLower) ||
      listing.ListingDescription?.toLowerCase().includes(searchLower) ||
      listing.propertyName?.toLowerCase().includes(searchLower));

    const matchesPrice = 
      !listing.marketRent || 
      (listing.marketRent >= filters.priceRange[0] && 
      listing.marketRent <= filters.priceRange[1]);

    const matchesBeds = 
      !filters.beds || 
      listing.beds === filters.beds;

    const matchesBaths = 
      !filters.baths || 
      listing.baths === filters.baths;

    const matchesSqft = 
      !listing.size || 
      (listing.size >= filters.sqftRange[0] && 
      listing.size <= filters.sqftRange[1]);

    return matchesSearch && 
           matchesPrice && 
           matchesBeds && 
           matchesBaths && 
           matchesSqft;
  });

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 10000],
      beds: undefined,
      baths: undefined,
      sqftRange: [0, 5000],
    });
  };

  const handleCardClick = (listing: Listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
    // Update URL with listing ID
    navigate(`?listingId=${listing.id}`, { replace: true });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
    // Remove listing ID from URL
    navigate('', { replace: true });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Empty
        description={error}
        style={{ padding: '48px' }}
      />
    );
  }

  if (listings.length === 0) {
    return (
      <Empty
        description="No listings found"
        style={{ padding: '48px' }}
      />
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Search and Filter Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col flex="350px">
          <Input.Search
            placeholder="Search listings"
            style={{ width: '100%', borderRadius: '8px' }}
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={(value) => setSearchTerm(value)}
          />
        </Col>
        <Col>
          <Button
            icon={<IconFilter size={16} />}
            onClick={() => setIsFilterDrawerOpen(true)}
            size="large"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Filters
          </Button>
        </Col>
      </Row>

      <Divider style={{ margin: '0 0 16px 0' }} />

      <Text style={{ 
        display: 'block', 
        marginBottom: '24px',
        fontSize: '14px',
        color: '#666' 
      }}>
        {filteredListings.length} {filteredListings.length === 1 ? 'property' : 'properties'} available
      </Text>

      <Drawer
        title="Filter Listings"
        placement="right"
        onClose={() => setIsFilterDrawerOpen(false)}
        open={isFilterDrawerOpen}
        width={window.innerWidth < 768 ? '100%' : 320}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Price Range</Title>
            <Slider
              range
              min={0}
              max={10000}
              value={filters.priceRange}
              onChange={(value) => handleFilterChange('priceRange', value)}
              marks={{ 0: '$0', 10000: '$10,000' }}
            />
          </div>

          <div>
            <Title level={5}>Bedrooms</Title>
            <Select
              style={{ width: '100%' }}
              placeholder="Select bedrooms"
              allowClear
              onChange={(value) => handleFilterChange('beds', value)}
            >
              {[1, 2, 3, 4, 5].map(num => (
                <Select.Option key={num} value={num}>{num} beds</Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <Title level={5}>Bathrooms</Title>
            <Select
              style={{ width: '100%' }}
              placeholder="Select bathrooms"
              allowClear
              onChange={(value) => handleFilterChange('baths', value)}
            >
              {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                <Select.Option key={num} value={num}>{num} baths</Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <Title level={5}>Square Footage</Title>
            <Slider
              range
              min={0}
              max={5000}
              value={filters.sqftRange}
              onChange={(value) => handleFilterChange('sqftRange', value)}
              marks={{ 0: '0', 5000: '5,000' }}
            />
          </div>

          <Space style={{ width: '100%' }}>
            <Button block onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button type="primary" block onClick={() => setIsFilterDrawerOpen(false)}>
              Apply Filters
            </Button>
          </Space>
        </Space>
      </Drawer>

      <Row gutter={[16, 16]}>
        {filteredListings.map(listing => (
          <Col 
            key={listing.id} 
            xs={24} sm={24} md={12} lg={8} xl={6}
          >
            <Card 
              hoverable
              bordered={false}
              onClick={() => handleCardClick(listing)}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'white'
              }}
              cover={
                <Image
                  preview={false}
                  alt={listing.ListingTitle || 'Property Image'}
                  src={listing.photos?.[0]?.fileUrl || '/placeholder-image.jpg'}
                  style={{ 
                    objectFit: 'cover',
                    height: '200px',
                    width: '100%',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
              }
              bodyStyle={{ 
                padding: '12px',
                background: 'white',
                borderRadius: '0 0 8px 8px'
              }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {listing.propertyName || 'Unnamed Property'}
                </Title>
                <Text style={{ color: '#666', fontSize: '14px' }}>
                  {listing.propertySettings?.propertyKind || 'Not specified'}
                </Text>
                <Text style={{ color: '#666', fontSize: '14px' }}>
                  {listing.address ? 
                    `${listing.address.street1}${listing.address.street2 ? ` ${listing.address.street2}` : ''}, ${listing.address.city}` 
                    : 'Address not available'}
                </Text>
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between" align="middle">
                  <Text style={{ color: '#666', fontSize: '14px' }}>
                    {`${listing.beds} bed • ${listing.baths} bath • ${listing.size} sqft`}
                  </Text>
                  <Text strong style={{ fontSize: '16px' }}>
                    {`$${listing.marketRent}`}
                    <span style={{ fontWeight: 'normal' }}>/month</span>
                  </Text>
                </Row>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <ListingModal
        visible={isModalOpen}
        onClose={handleModalClose}
        listing={selectedListing}
      />
    </div>
  );
};

export default ListingsPage;
