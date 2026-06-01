# ---------------------------------------------------------------
# RDS MODULE
# Creates: PostgreSQL RDS instance in private subnets,
#          subnet group, security group
# ---------------------------------------------------------------
resource "aws_db_subnet_group" "main" {
    name = "cloudshop-${var.environment}-db-sunet-group"
    subnet_ids = var.private_subnet_ids
    tags {
        Name    =   "cloudshop-${var.environment}-db-subnet-group"
    }
}

resource "aws_security_group" "rds" {
    name    =   "cloudshop-${var.environment}-rds-sg"
    description =   "allow Postgresql from eks nodes only"
    vpc_id     =    var.vpc_id

    ingress {
        from_port   =   5432
        to_port     =   5432
        protocol    =   "tcp"
        cidr_block  =   ["10.0.0.0/8"]
        description =   "PostgreSQL from VPC"
    }

    egress {
        from_port   =   0
        to_port     =   0
        protocol    =   -1
        cidr_block  =   ["0.0.0.0/0"]
    }
    tags {
        Name    =   "cloudshop-${var.environment}-rds-sg"
    }
}

resource  "aws_db_instance" "postgres" {
    identifier  = "cloudshop-${var.environment}-postgres"
    engine      = "postgres"
    engine_version = "15.4"
    instance_class = var.db_instance_class
    allocation_storage  = 20
    max_allocated_storage   =   100
    storage_encrypted   =   true
    
    db_name = "cloudshop"
    username = var.db_username
    password = var.db_password

    db_subnet_group_name    =  aws_db_subnet_group.main.name
    vpc_security_group_ids  =  [aws_security_group.rds.id]

    backup_retenetion_period   = 7
    backup_window       =   "03:00-04:00"
    maintenance_window  =   "sun:05:00-sun:06:00"
    
    skip_final_snapshot     =   false
    final_snapshot_identifier   =   "cloudshop-${var.environment}-final-snapshot"

    deletion_protection =   var.environment =="prod" ? true : false

    tags = {
        Name = "cloudshop-${var.environment}-postgres"
    }
}