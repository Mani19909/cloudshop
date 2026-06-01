# ---------------------------------------------------------------
# VPC MODULE
# Creates: VPC, public/private subnets, IGW, NAT Gateway,
#          route tables, and required EKS subnet tags
# ---------------------------------------------------------------
data "aws_availability_zones" "available" {
    state  = "available"
}

#----------- VPC --------------

resource "aws_vpc" "main" {
    cidr_block      =   var.vpc_cidr
    enable_dns_support  =   true
    enable_dns_hostnames = true

    tags = {
        Name = "cloudshop-${var.environment}-vpc"
    }
}

# -------------- Internet Gateway -----------
resource "aws_internet_gateway" "igw" {
    vpc_id = aws_vpc.main.id

    tags = {
        Name = "cloudshop-${var.environment}-igw"
    }
}
# ---------------- public subnets (2 AZs) ------
resource "aws_public_subnet" "public" {
    count           =   2
    vpc_id          =   aws_vpc.main.id
    cidr_block      =   cidrsubnet(var.vpc_cidr, 8, count.index)
    availability_zone = data.aws_availability_zones.available.names[count.index]
    map_public_ip_on_launch = true

    tags = {
        Name = "cloudshop-${var.environment}-public-${count.index + 1}"
    }
}

# ---- Private Subnets (2 AZs) ----
resource "aws_private_subnet" "private" {
    count       =   2 
    vpc_id      =   aws_vpc.main.id
    cidr_block  =   cidrsubnet(var.vpc_cidr, 8, count.index + 10)
    availability_zone   =  data.aws_availability_zones.available.names[count.index]

    tags =  {
        Name    =   "cloudshop-${var.environment}-private-${count.index + 1}"
        "kubernetes.io/role/internal-elb" = "1"
    }
}

# ------------ Elastic IP for NAT Gateway -----------
resource "aws_eip" "nat" {
    domain = "vpc"
    tags = {
        Name = "cloudshop-${var.environment}-nat-eip"
    }
}

# ---------------- NAT Gateway (placed in first public subnet) -------
resource "aws_nat_gateway" "nat" {
    allocation_id = aws_eip.nat.id
    subnet_id     = aws_subnet.public[0].id

    tags = {
        Name = "cloudshop-${var.environment}-nat"
    }
    depends_on  = [aws_internet_gateway.igw]
}

# ---------- Route Table: Public ---------------
resource "aws_route_table" "public" {
    vpc_id  =   aws_vpc.main.id

    route {
        cidr_block  =   "0.0.0.0/0"
        gateway_id  =   aws_internet_gateway.igw.id
    }
    tags = {
        Name = "cloudshop-${var.environment}-public-rt"
    }
}

resource "aws_route_table_association" "public" {
    count   =   2
    subnet_id   = aws_subnet.public[count.index].id
    route_table_id = aws_route_table.public.id
}

# ---- Route Table: Private (routes through NAT) ----
resource "aws_route_table" "private" {
    vpc_id = aws_vpc.main.id

    route {
        cidr_block  = "0.0.0.0/0"
        nat_gateway_id  =   aws_nat_gateway.nat.id
    }

    tags = {
        Name = "cloudshop-${var.environment}-private-rt"
    }
}
resource "aws_route_table_association" "private" {
    count   =   2
    subnet_id = aws_subnet.private[count.index].id
    route_table_id = aws_route_table.private.id
}
